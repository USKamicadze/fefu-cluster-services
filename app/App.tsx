import { State } from './state';
import * as React from 'react';
import {Provider} from 'react-redux';
import {Router, Route, IndexRoute, browserHistory, RouterState, RedirectFunction} from 'react-router';
import {syncHistoryWithStore} from 'react-router-redux';

import {store} from './store';
import * as Routes from './routes';
import {Account, MainComponent, ServiceSelector} from './components';
import services from '../common/services';

const history = syncHistoryWithStore(browserHistory, store);

function DummyComponent() {
	return <div>Dummy Component</div>;
}

function checkAuth(nextState: RouterState, replace:RedirectFunction, callback:Function) {
	const app = store.getState().app;
	const name = app && app.account && app.account.name;
	if (!name) {
		replace({
			pathname: Routes.account,
			state: { nextPathname: nextState.location.pathname }
		});
	}
	callback();
}

import {callService} from './actions/services';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
function prepareComponent(name: string, Component: any) {
	return connect<any, any, any>((state: State, ownProps: any) => {
		return {
			serviceName: name,
			service: state.app.services[name]
		}

	},
	(dispatch: any, ownProps: any) => {
		return bindActionCreators({callService}, dispatch);
	}
	)(Component);
}

export class App extends React.Component<{}, undefined> {
	renderServices() {
		return services.map(s => <Route 
			key={s.name} 
			path={`${Routes.services}/${s.name}`} 
			component={prepareComponent(s.name, s.Component)}
		/>);
	}

	render () {
		return <Provider store={store}>
			<Router history={history}>
				<Route path="/" component={MainComponent}>
					<Route path={Routes.account} component={Account}/>
					<Route onEnter={checkAuth}>
						<IndexRoute component={ServiceSelector}/>
						<Route path={Routes.services} component={ServiceSelector}/>
						{this.renderServices()}
					</Route>
				</Route>
			</Router>
		</Provider>;
	}
}