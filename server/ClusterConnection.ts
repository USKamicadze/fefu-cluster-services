import * as WS from 'ws';
import {Client as SSHClient, ClientChannel, ConnectConfig} from 'ssh2';

enum WebSocketMessageType {
    Connect,
    Custom,
    Error,
    Response
};

interface WebSocketMessage {
    type: WebSocketMessageType;
}

interface WebSocketMessageConnect extends WebSocketMessage {
    user: string;
    password: string;
}

interface WebSocketMessageCustom extends WebSocketMessage {
    command: string
}

interface WebSocketMessageResponse extends WebSocketMessage {
    output: string;
    error: string;
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
    private ssh: SSHClient;

    constructor(ws: WS) {
        this.websocket = ws;
        ws.on('message', (message) => {
            const wsm = JSON.parse(message) as WebSocketMessage;
            this.handleMessage(wsm);
        });
        ws.on('close', () => {
            if (this.ssh) {
                this.ssh.end();
            }
        })
    }

    async handleMessage(message: WebSocketMessage){
        switch (message.type) {
            case WebSocketMessageType.Connect:
                const connectMessage = message as WebSocketMessageConnect;
                const host = process.env.CLUSTER_HOST;
                const port = process.env.CLUSTER_PORT;
                const err = await this.connect({
                    host: host,
                    port: port,
                    username : connectMessage.user,
                    password : connectMessage.password
                });
                if (err) {
                    const response = {
                        type:WebSocketMessageType.Response,
                        error: err
                    } as WebSocketMessageResponse;
                    this.sendWSMessage(response);
                } else if (process.env.NODE_ENV == 'development') {
                    console.log(await this.executeSSHCommand('echo "anybody here?"'));
                    console.log(await this.executeSSHCommand('ls -la'));
                    console.log(await this.executeSSHCommand('echo "its working!!!"'));
                }
                break;
            case WebSocketMessageType.Custom:
                if (process.env.NODE_ENV == 'development') {
                    const customMessage = message as WebSocketMessageCustom;
                    const result = await this.executeSSHCommand(customMessage.command);
                    const response = {
                        type:WebSocketMessageType.Response,
                        output: result.out,
                        error: result.err
                    } as WebSocketMessageResponse;
                    this.sendWSMessage(response);
                    break;
                }
            default:
                console.log("WSMHandler: unknown message type");
                break;
        }
    }


    async connect(config: ConnectConfig){
        return new Promise((resolve, reject) => {
            const ssh = new SSHClient();
            ssh.on('error', (err) => {
                console.log('SSH: Ooops, something went wrong:');
                console.log(err);
                reject(err);
            });
            ssh.on('ready', () => {
                this.ssh = ssh;
                console.log("SHHClient ready!");
                resolve();
            });
            ssh.connect(config);
        });
    }

    async executeSSHCommand(command: string){
        return new Promise<{out: string, err: string}>((resolve, reject) => {
            if (!this.ssh) {
                const error = 'ssh connection is not ready';
                console.log(error);
                reject(error);
                return;
            }
            this.ssh.exec(command, (err, stream) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                let stdout = '';
                let stderr = '';
                stream.on('close', function() {
                    console.log('Stream :: close');
                    resolve({
                        out: stdout,
                        err: stderr
                    });
                }).on('data', function(data:any) {
                    stdout += data;
                    //console.log('STDOUT: ' + data);
                }).stderr.on('data', function(data:any) {
                    stderr += data;
                    //console.log('STDERR: ' + data);
                });
            });
        });
    }

    sendWSMessage(message: WebSocketMessage) {
        const data = JSON.stringify(message);
        console.log(`sending through ws: ${data}`);
        this.websocket.send(data, (err) => {
            console.log(`error during sending websocked message to browser: ${data}`);
        });
    }
    end() {
        this.websocket.close();
    }
}