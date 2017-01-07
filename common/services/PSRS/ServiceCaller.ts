import { WebSocketMessageCallService, WebSocketMessageStatus, WebSocketMessageType } from '../../Messages';
import { ClusterConnection } from '../../../server/ClusterConnection';
class ServiceCaller {
    constructor(private name: string){

    }

    async call(connection: ClusterConnection, data: any) {
        const res = await connection.executeSSHCommand("ls -la");
        const message : WebSocketMessageCallService = {
            data: res,
            service: this.name,
            status: WebSocketMessageStatus.SuccessResponse,
            type: WebSocketMessageType.CallService
        };
        connection.sendWSMessage(message);
    }
}

export default ServiceCaller;