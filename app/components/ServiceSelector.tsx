import * as React from "react";
import { connect } from "react-redux";
import {Link} from 'react-router';
import services from '../../common/services';
import * as Routes from '../routes';
interface IServiceSelectorProps {};

interface IServiceSelectorState {};

class ServiceSelector extends React.Component<IServiceSelectorProps, IServiceSelectorState> {
    public render(): JSX.Element {
        return <div>
            <div>ServiceSelector!</div>
            <ul>
                {services.map((s) => <li><Link key={s.name} to={`${Routes.services}/${s.name}`}>s.name</Link></li>)}
            </ul>
        </div>;
    }
}

export default connect(
    (state) => ({
        // Map state to props
    }),
    {
        // Map dispatch to props
    })(ServiceSelector);
