import { State } from './state';
import {Dispatch} from 'redux';
import {WebSocketAction} from './reducers';
import { WebSocketMessage } from '../common/Messages';
import {store} from './store';

class Connection {
    private ws: WebSocket;
    private ready: boolean;
    private dispatch: Dispatch<State>;

    constructor(dispatch: Dispatch<State>) {
        this.dispatch = dispatch;
        const location = window.location;
        const wsUri = (location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host;
        const ws = new WebSocket(wsUri);

        ws.onopen = () => {
            console.log("websocket opened");
            this.ready = true;
        };

        ws.onclose = () => {
            this.ready = false;
            console.log("websocket closed");
            alert('connection closed, try refresh page');
        };
        ws.onerror = (err) => {
            console.log("websoket error");
            console.log(err);
            alert('connection error, try refresh page');
        };
        ws.onmessage = (messageEvent) => {
            console.log("websoket message");
            console.log(messageEvent);
            this.dispatch({
                type: 'websocketAction',
                payload: JSON.parse(messageEvent.data)
            });
        };

        this.ws = ws;
    }

    public isReady() {
        return this.ready;
    }

    public sendMessage(message: WebSocketMessage) {
        this.ws.send(JSON.stringify(message));
    }
}

export const activeConnection = new Connection(store.dispatch);