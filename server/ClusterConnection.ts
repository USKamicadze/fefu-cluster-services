import {
    WebSocketMessage,
    WebSocketMessageConnect,
    WebSocketMessageCustom,
    WebSocketMessageError,
    WebSocketMessageResponse,
    WebSocketMessageStatus,
    WebSocketMessageType,
    WebSocketMessageCallService
} from '../common/Messages';
import * as WS from 'ws';
import {Client as SSHClient, ClientChannel, ConnectConfig} from 'ssh2';
import * as fs from 'fs';


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
    private services: any;

    constructor(ws: WS, services: any) {
        this.websocket = ws;
        this.services = services;
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
        try {
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
                        const response : WebSocketMessageError = {
                            type:WebSocketMessageType.Connect,
                            status: WebSocketMessageStatus.ErrorResponse,
                            data: err
                        };
                        this.sendWSMessage(response);
                    } else {
                        const response : WebSocketMessageConnect = {
                            user: connectMessage.user,
                            password: undefined,
                            status: WebSocketMessageStatus.SuccessResponse,
                            type: WebSocketMessageType.Connect
                        };
                        this.sendWSMessage(response);
                    }
                    break;
                case WebSocketMessageType.Disconnect:
                    this.ssh.end();
                    break;
                case WebSocketMessageType.CallService:
                    const callServiceMessage = message as WebSocketMessageCallService;
                    const service = this.services[callServiceMessage.service];
                    service.call(this, callServiceMessage);
                    break;
                case WebSocketMessageType.Custom:
                    if (process.env.NODE_ENV == 'development') {
                        const customMessage = message as WebSocketMessageCustom;
                        const result = await this.executeSSHCommand(customMessage.command);
                        const response : WebSocketMessageResponse = {
                            type:WebSocketMessageType.Custom,
                            status: WebSocketMessageStatus.SuccessResponse,
                            output: result.out,
                            error: result.err
                        };
                        this.sendWSMessage(response);
                        break;
                    }
                
                default:
                    console.log("WSMHandler: unknown message type");
                    break;
            }
        } catch (e){
            const response :WebSocketMessageError = {
                type: message.type,
                status: WebSocketMessageStatus.ErrorResponse,
                data: e
            };
            this.sendWSMessage(response);
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
            ssh.on("end", () => {
                console.log("ssh connection ended");
                if (this.websocket.readyState == this.websocket.OPEN) {
                    const message: WebSocketMessage = {
                        type: WebSocketMessageType.Disconnect,
                        status: WebSocketMessageStatus.SuccessResponse
                    };
                    this.sendWSMessage(message);
                }
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

    writeToFile(data: string, file: string) {
        return new Promise((resolve, reject) => {
            this.ssh.sftp((err, sftp) => {
                if (err) {
                    console.log("Error, problem starting SFTP: %s", err);
                    reject(err);
                    return;
                }
                console.log("SFTP started");

                const writeStream = sftp.createWriteStream(file);
                writeStream.on('close', () => {
                    console.log(`file transfered to ${file}`);
                    sftp.end();
                    resolve();
                });

                writeStream.write(data);
                writeStream.end();
            });
        });
    }

    uploadFile(source: string, dist: string) {
        return new Promise((resolve, reject) => {
            this.ssh.sftp((err, sftp) => {
                if (err) {
                    console.log("Error, problem starting SFTP: %s", err);
                    reject(err);
                    return;
                }
                console.log("SFTP started");

                const readStream = fs.createReadStream(source);
                const writeStream = sftp.createWriteStream(dist);
                writeStream.on('close', () => {
                    console.log(`file ${source} transfered to ${dist}`);
                    sftp.end();
                    resolve();
                });

                readStream.pipe( writeStream );
            });
        });
    }

    sendWSMessage(message: WebSocketMessage) {
        const data = JSON.stringify(message);
        console.log(`sending through ws: ${data}`);
        this.websocket.send(data, (err) => {
            if (err) {
                console.log(`error during sending websocked message to browser: ${data}`);
                console.log(err);
            }
        });
    }

    end() {
        this.websocket.close();
    }
}