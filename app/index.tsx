import { App } from './components/App';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const location = window.location;
const wsUri = (location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host;
const ws = new WebSocket(wsUri);

ws.onopen = () => {
    console.log("websocket opened");

    ws.send(JSON.stringify({user: "mukhin_av", password: "badpass", type: 0}));
    setTimeout(function () {
        ws.send(JSON.stringify({command: 'ls -la', type: 1}));
    }, 10000);
};


ws.onclose = () => {
    console.log("websocket closed");
};

ws.onerror = (err) => {
    console.log("websoket error");
    console.log(err);
};

ws.onmessage = (messageEvent) => {
    console.log("websoket message");
    console.log(messageEvent);
};
ReactDOM.render(<App/>, document.getElementById('app-root'));
