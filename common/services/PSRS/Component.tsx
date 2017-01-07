import * as React from 'react';

interface ServiceComponentActions{
    callService(name: string, data: any): any;
}

interface ServiceComponentProps{
    serviceName: string;
}

class Component extends React.Component<ServiceComponentProps & ServiceComponentActions, {values: number[]}> {
    constructor(props: ServiceComponentProps & ServiceComponentActions) {
        super(props);
        this.state = {values: [1, 3, 345, 345,3,345,2,676,5,98, 234,111, 23, 34,5]};
    }
    handleBlur(e:any) {
        this.setState({
            values: JSON.parse(e.target.value)
        })
    }
    render() {
        return <div>
            <span>This is PSRS service</span>
            <textarea value={JSON.stringify(this.state.values)}></textarea>
            <button onClick={() => this.props.callService(this.props.serviceName, this.state.values)}>Sort</button>
        </div>;
    }
}

export default Component;