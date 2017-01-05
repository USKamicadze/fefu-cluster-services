import * as SSH from 'simple-ssh';
import * as WS from 'ws';

enum WebSocketMessageType {
    Connect,
};

interface WebSocketMessage {
    type: WebSocketMessageType;
}

interface WebSocketMessageConnect extends WebSocketMessage {
    user: string;
    password: string;
}

interface SSHConfig {
    host: string;
    port?: number;
    user?: string;
    pass?: string;
    timeout?: number; //default: 10000
    key?: string;
    passphrase?: string;
    baseDir?: string;
    agent?: string;
    agentForward?: boolean;
}

export class ClusterConnection {
    private websocket: WS;
    private ssh: any;

    constructor(ws: WS) {
        this.websocket = ws;
        ws.on('message', (message) => {
            const wsm = JSON.parse(message) as WebSocketMessage;
            this.handleMessage(wsm);
        })
    }

    handleMessage(message: WebSocketMessage){
        switch (message.type) {
            case WebSocketMessageType.Connect:
                const connectMessage = message as WebSocketMessageConnect;
                const host = process.env.CLUSTER_HOST;
                const port = process.env.CLUSTER_PORT;
                this.connect({
                    host: host,
                    port: port,
                    user: connectMessage.user,
                    pass: connectMessage.password
                });
                break;
            default:
                console.log("WSMHandler: unknown message type");
                break;
        }
    }


    connect(config: SSHConfig){
        this.ssh = new SSH(config);
    }
}