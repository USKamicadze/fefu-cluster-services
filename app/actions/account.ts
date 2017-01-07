import {
    WebSocketMessage,
    WebSocketMessageCallService,
    WebSocketMessageConnect,
    WebSocketMessageStatus,
    WebSocketMessageType
} from '../../common/Messages';
import { activeConnection } from '../connection';

export function signin(name: string, password: string) {
    const message : WebSocketMessageConnect = {
        password : password,
        user : name,
        type : WebSocketMessageType.Connect,
        status : WebSocketMessageStatus.Request
    };
    activeConnection.sendMessage(message);
    return {
        type: 'websocketAction',
        payload: message
    }
}

export function signout(){
    const message: WebSocketMessage = {
        type: WebSocketMessageType.Disconnect,
        status: WebSocketMessageStatus.Request,
    };
    activeConnection.sendMessage(message);
    return {
        type: 'websocketAction',
        payload: message
    }
}

