import { WebSocketMessageStatus, WebSocketMessageType } from '../../common/Messages';
import * as React from "react";
import { connect } from "react-redux";
import {activeConnection} from '../connection';

class DevelopmentComponent extends React.Component<{}, {message: string}> {
    
    constructor(props: {}){
        super(props);
        this.handleSend = this.handleSend.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            message: 
`{
    "type": 0,
    "status": 0,
    "user": "m",
    "password": "badpass"
}`
        };
    }
    
    handleChange(e: any) {
        this.setState({
            message: e.target.value
        });
    }

    handleSend() {
        const message = JSON.parse(this.state.message);
        activeConnection.sendMessage(message);
    }

    renderEnum(enumStruct: any) {
        let res = '';
        for(let k in enumStruct) {
            res += `${enumStruct[k]}: ${enumStruct[enumStruct[k]]}` + "\n";
        }
        return res;
    }

    render() {
        return <div>
            <textarea placeholder="devtool" value={this.state.message} onChange={this.handleChange} />
            <button onClick={this.handleSend}>Send</button>
            <pre>
                {this.renderEnum(WebSocketMessageType)}
            </pre>
            <pre>
                {this.renderEnum(WebSocketMessageStatus)}
            </pre>
        </div>
    }
}

interface IMainComponentProps {};

interface IMainComponentState {};

class MainComponent extends React.Component<IMainComponentProps, IMainComponentState> {
    public render(): JSX.Element {
        return <div>
            {this.props.children}
            {$DevelopmentMode && <DevelopmentComponent/>}
        </div>;
    }
}

export default connect(
    (state) => ({
        // Map state to props
    }),
    {
        // Map dispatch to props
    })(MainComponent);
