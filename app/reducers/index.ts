import { AccountStatus, AppState, State } from '../state';
import {
    WebSocketMessage,
    WebSocketMessageCallService,
    WebSocketMessageConnect,
    WebSocketMessageError,
    WebSocketMessageStatus,
    WebSocketMessageType
} from '../../common/Messages';
import { combineReducers, Action } from 'redux';
import {routerReducer} from 'react-router-redux';
import * as update from 'immutability-helper';

export interface WebSocketAction extends Action {
	type: 'websocketAction';
	payload: WebSocketMessage;
}

interface WebSocketReducer {
	<T extends WebSocketMessage>(state: AppState, message: T) : any;
}

interface WebSocketReducers {
	[type: number] : {
		[status: number] : WebSocketReducer
	}
}

const websocketReducers: WebSocketReducers = {
	[WebSocketMessageType.Connect] : {
		[WebSocketMessageStatus.Request] : (state: AppState, message: WebSocketMessageConnect) => {
			const newStatus = AccountStatus.Connecting;

			return update(state, {account: {status: {$set: newStatus}}});
		},
		[WebSocketMessageStatus.SuccessResponse] : (state: AppState, message: WebSocketMessageConnect) => {
			const newStatus = AccountStatus.Signedin;
			return update(state, {
				account: {
					status: {$set: newStatus},
					name: {$set: message.user}
				}
			})
		},
		[WebSocketMessageStatus.ErrorResponse] : (state: AppState, message: WebSocketMessageError) => {
			const newStatus = AccountStatus.Signedout;
			return update(state, {
				account: {
					status: {$set: newStatus},
					name: {$set: null}
				}
			});
		}
	},
	[WebSocketMessageType.Disconnect] : {
		[WebSocketMessageStatus.Request] : (state: AppState, message: WebSocketMessage) => {
			const newStatus = AccountStatus.Connecting;
			return update(state, {account: {status: {$set: newStatus}}});
		},
		[WebSocketMessageStatus.SuccessResponse] : (state: AppState, message: WebSocketMessage) => {
			const newStatus = AccountStatus.Signedout;
			return update(state, {
				account: {
					status: {$set: newStatus},
					name: {$set: null}
				}
			})
		},
		[WebSocketMessageStatus.ErrorResponse] : (state: AppState, message: WebSocketMessage) => {
			const newStatus = AccountStatus.Signedout;
			return update(state, {
				account: {
					status: {$set: newStatus},
					name: {$set: null}
				}
			});
		}
	},
	[WebSocketMessageType.CallService] : {
		[WebSocketMessageStatus.Request] : (state: AppState, message: WebSocketMessageCallService) => {
			//const newStatus = AccountStatus.Connecting;
			const service = message.service;
			if (!state.services[service]) {
				return update(state, {services: {[service]: {$set: {status: 'working'}}}});
			}
			return update(state, {services: {[service]: {status: {$set: 'working'}}}});
		},
		[WebSocketMessageStatus.SuccessResponse] : (state: AppState, message: WebSocketMessageCallService) => {
			const service = message.service;
			return update(state, {services: {
				[service]: {
					status: {$set: 'completed'},
					data: {$set: message.data}
				}}
			});
		},
		[WebSocketMessageStatus.ErrorResponse] : (state: AppState, message: WebSocketMessageCallService) => {
			const service = message.service;
			return update(state, {services: {
				[service]: {
					status: {$set: 'failed'},
					data: {$set: message.data}
				}}
			});
		}
	}
}

/**
 * I tried to isolate websocket actions that fires by WebSocketMessage
 */
const mainWebsocketActionsReducer = {
	websocketAction : function(state: AppState, action: WebSocketAction) {
		const message = action.payload;
		const messageReducers = websocketReducers[message.type];
		if (messageReducers) {
			const reducer = messageReducers[message.status];
			if (!reducer) {
				console.error(
					`likely you have an error: found reducers for message type: ${WebSocketMessageType[message.type]}`
					+ `, but there is no reducer for message with status: ${WebSocketMessageStatus[message.status]}`);
			} else {
				return reducer(state, message);
			}
		}
		return state;
	}
};

const reducers = Object.assign({}, mainWebsocketActionsReducer);

const initialState : AppState = {
	account : {
		name: null,
		status: AccountStatus.Signedout
	},
	services : {

	}
}

function mainReducer(state = initialState, action: WebSocketAction) {
		var reducer = reducers[action.type];
		var nextState = reducer != null
			? reducer(state, action)
			: state;

		return nextState;
}

export default combineReducers<State>({
	app: mainReducer,
	routing: routerReducer,
});