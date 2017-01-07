export interface ServiceState {
    status: string;
    data: any;
}

export enum AccountStatus {
    Signedout,
    Connecting,
    Signedin
}

export interface AppState {
    account: {
        name: string,
        status: AccountStatus
    },
    services: {
        [service: string]: ServiceState
    }
}


export interface State {
    app: AppState;
}