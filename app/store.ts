import { State } from './state';
import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from './reducers';
import * as createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import {browserHistory} from 'react-router';
import {routerMiddleware} from 'react-router-redux';

function configureStore(initialState: State) {
	const logger = createLogger();
	const w = window as any;
	let middleware = applyMiddleware(thunk, logger, routerMiddleware(browserHistory));
	if (w.devToolsExtension) {
		middleware = compose(middleware, w.devToolsExtension());
	}
	return createStore<State>(rootReducer, initialState, middleware);
}

export const store = configureStore(undefined);