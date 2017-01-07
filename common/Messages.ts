import { WebSocketAction } from '../app/reducers';

export enum WebSocketMessageType {
    Connect,
    Custom,
    Error,
    Disconnect,
    CallService
};

export enum WebSocketMessageStatus {
    Request,
    ErrorResponse,
    SuccessResponse
};

export interface WebSocketMessage {
    type: WebSocketMessageType;
    status: WebSocketMessageStatus;
}

export interface WebSocketMessageConnect extends WebSocketMessage {
    user: string;
    password: string;
}

export interface WebSocketMessageCustom extends WebSocketMessage {
    command: string
}

export interface WebSocketMessageResponse extends WebSocketMessage {
    output: string;
    error: string;
}

export interface WebSocketMessageError extends WebSocketMessage {
    data: any;
}

export interface WebSocketMessageCallService extends WebSocketMessage {
    service: string;
    data: any;
}