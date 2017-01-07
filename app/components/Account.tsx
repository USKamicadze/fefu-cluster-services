import { AccountStatus, State } from '../state';
import * as React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';
import * as update from 'immutability-helper';
import * as Actions from '../actions/account';

interface AccountProps {
    account: {name: string, status: AccountStatus};
}

interface AccountActions {
    signin: (name: string, password: string) => any;
    signout: () => any;
    redirect:() => any;
}

interface SigninFormState {
    name: string;
    password: string;
}

class SigninForm extends React.Component<AccountActions, SigninFormState> {

    constructor(props: AccountActions) {
        super(props);
        this.state = {
            name: '',
            password: ''
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(field: keyof SigninFormState) {
        return (e: any) => {
            this.setState(update(this.state, {[field]: {$set: e.target.value}}));
        }
    }

    render() {
        const submit = (e: any) => {
            e.preventDefault();
            this.props.signin(this.state.name, this.state.password);
        };
        return <form onSubmit={submit}>
            <input type="text" placeholder="username" onChange={this.handleChange('name')}/>
            <input type="password" placeholder="password" onChange={this.handleChange('password')}/>
            <button onClick={submit}>Signin</button>
        </form>
    }
}


class AccountComponent extends React.Component<AccountProps & AccountActions,undefined> {
    
    componentWillReceiveProps(nextProps : AccountProps){
        const status = this.props.account && this.props.account.status;
        const nextStatus = nextProps.account && nextProps.account.status;
        if (status != nextStatus && nextStatus == AccountStatus.Signedin){
            this.props.redirect();
        }
    }

    render(){
        const name = this.props.account && this.props.account.name; 
        if (name) {
            return <div>Welcome {this.props.account.name} <button onClick={this.props.signout}>Signout</button></div>
        }
        return <SigninForm {...this.props} />
    }
}

export const Account = connect(
    (state: State, ownProps) => {
        const account = state && state.app && state.app.account;
        return {
            account: account
        } as AccountProps;
    },
    (dispatch, ownProps) => {
        const location = (ownProps as any).location;
        const res : AccountActions = {
            ...bindActionCreators({...Actions}, dispatch),
            redirect: () => dispatch(push(location.state.nextPathname || '/'))
        };
        return res;
    }
)(AccountComponent);