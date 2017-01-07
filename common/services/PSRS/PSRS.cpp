#include <string>
#include <vector>
#include <iostream>
#include <fstream>
#include <iomanip>
#include <algorithm>
#include "mpi.h"

#define debug(X) cout << "+++" << ProcessId << ":" << X << "+++" <<  endl
using namespace  std;

//mpic++ -o PSRS PSRS.cpp

double StartTime, EndTime;
int ProcessCount;
int ProcessId;
string ProcessName;

int RandSeed = 0;
int DataSize = 110;
int MaxValue = 10000;

string DataSource = "";

vector<int> Data;
vector<int> Lengths;
vector<int> DataStarts;
vector<int> Pivots;
vector<int> ClassStart;
vector<int> ClassLength;
vector<int> ClassData (1);
vector<int> SortedData;

template <class ForwardIterator>
bool issorted (ForwardIterator first, ForwardIterator last) {
    if (first == last) return true;
    ForwardIterator next = first;
    while (++next != last) {
        if (*next < *first)
            return false;
        ++first;
    }
    return true;
}

string GetProcessorName() {
    char processor_name[MPI_MAX_PROCESSOR_NAME];
    int name_len;
    MPI::Get_processor_name(processor_name, name_len);
    return processor_name;
}

int GetDataLengthOfCurProcess() {
    return Lengths[ProcessId];
}

bool IsMainProcess() {
    return ProcessId == 0;
}

void ParseArgs(int argc, char* argv[]) {
    for(int i = 0; i < argc; ++i){
        string arg = argv[i];
        if (arg == "-DS") {
            DataSize = atoi(argv[++i]);
        } else if (arg == "-RS") {
            RandSeed = atoi(argv[++i]);
        } else if (arg == "-MAX") {
            MaxValue = atoi(argv[++i]);
        } else if (arg == "-SOURCE") {
			DataSource = argv[++i];
		}
    }
}

void GenerateData() {
    for (int i = 0; i < DataSize; ++i) {
        Data[i] = random() % MaxValue;
    }
}

void ComputeLengths() {
    Lengths.resize(ProcessCount);
    DataStarts.resize(ProcessCount);
    int DataPerProc = DataSize / ProcessCount;
    for (int i = 0; i < ProcessCount; ++i) {
        Lengths[i] = DataPerProc;
        DataStarts[i] = i * DataPerProc;
    }
    Lengths[ProcessCount - 1] += DataSize % ProcessCount;
}

void ReadData(string fileName){
	ifstream in(fileName.c_str());
	DataSize = 0;
	int value;
	while(in >> value){
		Data.push_back(value);
		DataSize++;
	}
}

void Init(int argc, char* argv[]) {
    MPI::Init(argc, argv);
    ProcessCount = MPI::COMM_WORLD.Get_size();
    ProcessId = MPI::COMM_WORLD.Get_rank();
    ProcessName = GetProcessorName();
    ParseArgs(argc, argv);
	if (IsMainProcess()) {
		if (!DataSource.empty()) {
			ReadData(DataSource);
		} else {
			Data.resize(DataSize);
			GenerateData();
		}
    }
	MPI::COMM_WORLD.Bcast(&DataSize, 1, MPI::INT, 0);
    ComputeLengths();
	if (!IsMainProcess()) {
		Data.resize(GetDataLengthOfCurProcess());
	}
    Pivots.resize(ProcessCount);
	if (IsMainProcess()) {
		StartTime = MPI::Wtime();
	}
}

void Scatter() {
    if (IsMainProcess()) {
        MPI::COMM_WORLD.Scatterv(
            &Data[0], &Lengths[0], &DataStarts[0],
            MPI::INT, MPI_IN_PLACE,
            GetDataLengthOfCurProcess(), MPI::INT, 0
        );
        Data.resize(GetDataLengthOfCurProcess());
    } else {
        MPI::COMM_WORLD.Scatterv(
            &Data[0], &Lengths[0], &DataStarts[0],
            MPI::INT, &Data[0],
            GetDataLengthOfCurProcess(), MPI::INT, 0
        );
    }
}

void SortLocalPart() {
    sort(Data.begin(), Data.begin() + GetDataLengthOfCurProcess());
}

void GatherPivots() {
    Pivots.resize(ProcessCount * ProcessCount);
    if (IsMainProcess()) {
        MPI::COMM_WORLD.Gather(
            MPI_IN_PLACE, ProcessCount, MPI::INT,
            &Pivots[0], ProcessCount, MPI::INT, 0
        );
    } else {
        MPI::COMM_WORLD.Gather(
            &Pivots[0], ProcessCount, MPI::INT,
            &Pivots[0], ProcessCount, MPI::INT, 0
        );
    }
}

void ChoosePivots() {
    int psqr = ProcessCount * ProcessCount;
    for (int i = 0; i < ProcessCount; ++i) {
        Pivots[i] = Data[i * DataSize / psqr];
    }
    GatherPivots();
    if (IsMainProcess()) {
        sort(Pivots.begin(), Pivots.end());
    }
    vector<int> temp(ProcessCount - 1);
    for (int i = 0; i < ProcessCount - 1; ++i) {
        temp[i] = Pivots[(i + 1) * ProcessCount + ProcessCount / 2 - 1];
    }
    Pivots = temp;
    MPI::COMM_WORLD.Bcast(&Pivots[0], ProcessCount - 1, MPI::INT, 0);
}

void SplitDataOnClasses() {
    ClassStart.resize(ProcessCount);
    ClassLength.resize(ProcessCount);
    int curPos = 0;
    for (int i = 0; i < ProcessCount - 1; ++i) {
        ClassStart[i] = curPos;
        ClassLength[i] = 0;
        while (curPos < GetDataLengthOfCurProcess() && Data[curPos] <= Pivots[i]) {
            ++ClassLength[i];
            ++curPos;
        }
    }
    ClassStart[ProcessCount - 1] = curPos;
    ClassLength[ProcessCount - 1] = GetDataLengthOfCurProcess() - curPos;
}

void CollectClassInProcess() {
    int recvLength[ProcessCount];
    int recvStart[ProcessCount];
    for (int i = 0; i < ProcessCount; ++i) {
        MPI::COMM_WORLD.Gather(&ClassLength[i], 1, MPI::INT,
                               recvLength, 1, MPI::INT, i);
        if (ProcessId == i) {
            recvStart[0] = 0;
            for (int j = 1; j < ProcessCount; ++j) {
                recvStart[j] = recvStart[j - 1] + recvLength[j - 1];
            }
            ClassData.resize(recvStart[ProcessCount - 1] + recvLength[ProcessCount - 1]);
        }
        MPI::COMM_WORLD.Gatherv(&Data[ClassStart[i]], ClassLength[i], MPI::INT,
                &ClassData[0], recvLength, recvStart, MPI::INT, i);
    }
    sort(ClassData.begin(), ClassData.end());
}

void CollectAll(){
    int lengths[ProcessCount];
    int starts[ProcessCount];
    int length = ClassData.size();

    MPI::COMM_WORLD.Gather(&length, 1, MPI::INT, lengths, 1, MPI::INT, 0);

    if (IsMainProcess()) {
        starts[0] = 0;
        for(int i = 1; i < ProcessCount; ++i) {
            starts[i] = starts[i - 1] + lengths[i - 1];
        }

    }

    SortedData.resize(DataSize);
    MPI::COMM_WORLD.Gatherv(
        &ClassData[0], length, MPI::INT,
        &SortedData[0], lengths, starts, MPI::INT, 0
    );
}

void Sort() {
    Scatter();
    SortLocalPart();
    ChoosePivots();
    SplitDataOnClasses();
    CollectClassInProcess();
    CollectAll();
}

void Finalize() {
    if (IsMainProcess()) {
        EndTime = MPI::Wtime();
		cout << "{";
		cout << endl << "\t\"time\" : " << scientific << setprecision(4) << EndTime - StartTime;
		cout << "," << endl << "\t\"data\" : [" << endl << "\t\t";
		int size = SortedData.size();
		for(int x = 0; x < size; ++x) {
            cout << SortedData[x];
			if (x < size - 1) {
				cout << ", ";
			}
        }
		cout << endl << "\t]";
		cout << endl << "}" << endl;
    }
    MPI::Finalize();
}

int main(int argc, char* argv[]) {
    Init(argc, argv);
    Sort();
    Finalize();
    return 0;
}
