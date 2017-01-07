import { WebSocketMessageCallService, WebSocketMessageStatus, WebSocketMessageType } from '../../Messages';
import { ClusterConnection } from '../../../server/ClusterConnection';
import * as path from 'path';
class ServiceCaller {

    private executableFileName: string;
    private folderName: string;

    constructor(private name: string){
        this.executableFileName = `.cluster-services/${this.name}/PSRS`;
        this.folderName = `.cluster-services/${this.name}`;
    }

    async fileExists(connection: ClusterConnection, file: string) {
        const res = await connection.executeSSHCommand(`test -e ${file} && echo "true"`);
        return res.out;
    }

    async init(connection: ClusterConnection) {
        if (!await this.fileExists(connection, this.executableFileName)) {
            const res = await connection.executeSSHCommand(`mkdir -p ${this.folderName}/tasks`);
            console.log(res);
            const upres = await connection.uploadFile(path.resolve(__dirname, 'PSRS.cpp'), `${this.folderName}/PSRS.cpp`);
            console.log(upres);
            const compileRes = await connection.executeSSHCommand(`module load openmpi-1.8.8 && mpic++ -o ${this.executableFileName} ${this.folderName}/PSRS.cpp`);
            console.log(compileRes);
        }
    }

    async call(connection: ClusterConnection, message: WebSocketMessageCallService) {
        await this.init(connection);
        const data = message.data;
        const processCount = parseInt(data.processCount, 10);
        const arr : number[] = data.values;
        const timestamp = new Date().getTime();
        const datafileName = `${this.folderName}/tasks/${timestamp}.txt`;
        await connection.writeToFile(arr.join(' '), datafileName);
        const beginTime = process.hrtime();
        const res = await connection.executeSSHCommand(`srun -n ${processCount} ${this.executableFileName} -SOURCE ${datafileName}`);
        const diffTime = process.hrtime(beginTime);
        const responseData = JSON.parse(res.out);
        responseData.executionTime = diffTime;
        const response : WebSocketMessageCallService = {
            data: responseData,
            service: this.name,
            status: WebSocketMessageStatus.SuccessResponse,
            type: WebSocketMessageType.CallService
        };
        connection.sendWSMessage(response);
    }
}

export default ServiceCaller;