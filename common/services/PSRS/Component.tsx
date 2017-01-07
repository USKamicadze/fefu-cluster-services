import { ServiceState } from '../../../app/state';
import * as React from 'react';

interface ServiceComponentActions{
    callService(name: string, data: any): any;
}

interface ServiceComponentProps{
    serviceName: string;
    service: ServiceState;
}

interface ComponentState {
    text: string;
    processCount: number;
}

function getNumber<T>(n: any, base: T): number | T {
	const number = parseInt(n);
	if (!isNaN(number) && isFinite(number)) {
		return number;
	}
	return base;
}

class Component extends React.Component<ServiceComponentProps & ServiceComponentActions, ComponentState> {
    constructor(props: ServiceComponentProps & ServiceComponentActions) {
        super(props);
        this.state = {
            text: "1 3 345 345 3 345 2 676 5 98  234 111 23 34 5",
            processCount: 3
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleProcessCountChange = this.handleProcessCountChange.bind(this);
    }

    
    handleProcessCountChange(e: any){
        const newValue = e.target.value;
        this.setState({
            ...this.state,
            processCount: newValue
        });
    }

    handleChange(e:any){
        this.setState({
            ...this.state,
            text: e.target.value
        });
    }

    renderData(data: any){
        if (!data) {
            return "No results";
        }
        return <div>
            <div>
                executionTime: {data.time * 1e9} nanoseconds
            </div>
            <div>
                {data.data.join(" ")}
            </div>
        </div>
    }

    render() {
        const status = this.props.service && this.props.service.status || 'Service waiting';
        const data = this.props.service && this.props.service.data;
        return <div>
            <div>This is {this.props.serviceName} service: {status}</div>
            <div>
                <textarea
                    style={{width: "100%"}}
                    value={this.state.text}
                    onChange={this.handleChange}
                    onBlur={(e:any) => {
                        this.setState({
                            ...this.state, 
                            text: this.state.text.trim()
                                .split(/\s+/)
                                .map((s) => getNumber(s, null))
                                .filter((s) => s != null).join(" ")
                        });
                    }}
                    placeholder="values"
                />
            </div>
            <div>
                <input
                    type="text"
                    onChange={this.handleProcessCountChange}
                    onBlur={(e: any)=>this.setState({
                        ...this.state,
                        processCount: Math.abs(getNumber(e.target.value, 1))
                    })}
                    placeholder="process count"
                    value={this.state.processCount}/>
            </div>
            <div>
            <button onClick={() => 
                this.props.callService(this.props.serviceName, {
                    processCount: this.state.processCount,
                    values: this.state.text.trim()
                        .split(/\s+/)
                        .map((s) => getNumber<null>(s, null))
                        .filter((s) => s != null)
                })}
            >
                Sort
            </button>
            </div>
            <div>{this.renderData(data)}</div>
        </div>;
    }
}

export default Component;