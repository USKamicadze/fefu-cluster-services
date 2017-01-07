import { activeConnection } from '../connection';
import { WebSocketMessageCallService, WebSocketMessageStatus, WebSocketMessageType } from '../../common/Messages';
export function callService(name: string, data: any) {
    const message: WebSocketMessageCallService = {
        type: WebSocketMessageType.CallService,
        status: WebSocketMessageStatus.Request,
        service: name,
        data: data
    };
    activeConnection.sendMessage(message);
    return {
        type: 'websocketAction',
        payload: message
    };
}