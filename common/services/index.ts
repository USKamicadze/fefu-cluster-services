import PSRS from './PSRS';
interface Service{
    name: string;
    Component: any;
    Caller: any;
}


const services: Service[] = [{name: 'PSRS', ...PSRS}];
export default services;