import React, {PureComponent} from 'react';
import subscribe from './socket-listener';
import {IMessage, ISerialMessage, IStatusMessage} from './interfaces';
import logo from './Taltech.png';
import { BoatCanvas } from "./BoatCanvas";
import {scan, filter, map} from 'rxjs/operators';

import './App.css';

const MAX_EVENTS = 100;
const zoom = 4;

interface ILastLocation {
    phi: number;
    sp_x?: number;
    sp_y?: number;
    x: number;
    y: number;
}

interface IAppState {
    log: IMessage[];
    offline: boolean;
    lastLocation?: ILastLocation;
    points: ILastLocation[];
    status?: string | undefined;

}

function messageIsSerial(message: IMessage): message is ISerialMessage {
    return message && message.type === 'serial';
}

function messageIsStatus(message: IMessage): message is IStatusMessage {
    return message && message.type === 'status';
}


class App extends PureComponent<{}, IAppState> {
    statusTimeout?: number | null;
    state: IAppState = {
        log: [],
        offline: false,
        points: [],
        status: undefined,
    };

    offlineTimeout?: number | null;

    resetOffline(): void {
        if (this.offlineTimeout) {
            window.clearTimeout(this.offlineTimeout);
        }
        this.setState({offline: false});
        this.offlineTimeout = window.setTimeout(() => {
            this.setState({offline: true});
        }, 5000);
    }

    displayStatusMessage() {


        if (this.statusTimeout) {
            window.clearTimeout(this.statusTimeout);
        }

        this.statusTimeout = window.setTimeout(() => {
            this.setState({
                status: undefined,
            })
        }, 10000);


    }

    componentDidMount() {
        console.log('App mounted');
        const obs = subscribe();
        this.resetOffline();
        const arrayObs = obs.pipe(
            scan((acc: IMessage[], current: IMessage): IMessage[] => [...acc.slice(acc.length > MAX_EVENTS ? 1 : 0), current], [] as IMessage[])
        );

        const positionMessages$ = arrayObs.pipe(
            map((messages: IMessage[]): ISerialMessage[] => messages.filter(message => messageIsSerial(message) && message.msg === 1) as ISerialMessage[]),
            map((messages: ISerialMessage[]): ILastLocation[] => messages.map(message => message.parsed as ILastLocation))
        );

        obs.subscribe((message: IMessage) => {
            if (!message || typeof message !== "object") {
                return;
            }
            if (!messageIsSerial(message)) {
                return;
            }
            if (message.msg !== 1) {
                return;
            }
            const lastLocation = message.parsed as ILastLocation;
            this.setState({ lastLocation });
            console.log('[App] Location update:', lastLocation);
        });
        obs.subscribe((message: IMessage) => {
            if (messageIsStatus(message)) {
                this.setState({
                    status: message.text,
                });
            }
        });

        arrayObs.subscribe((eventLog) => {
            this.resetOffline();
            this.setState({ log: eventLog });
        });

        positionMessages$.subscribe((points) => {
            this.setState({ points });
        });
    }
     statusDisplay(){
        if(this.state.status){
            return this.state.status
        }
        if(this.state.offline){
            return "offline"
        }
        return '';
    }
    render() {
        const last = this.state.lastLocation;
        const points = this.state.points;


        return (
            <div className="App">

                <div className="container row">


                    <div className="left column">
                        <div className={"popup" +
                        (this.state.status || this.state.offline ? " show" : '')} id="popup">
                            Current status: {this.statusDisplay()}
                        </div>
                        <div className="legend row">
                            <img src={logo} className="logo" alt=""/>
                            This model was made by CPSE students<br/>
                            Tartu 2019
                        </div>
                        <div className="message_log">
                            <h2>Raw Packets</h2>
                            {this.state.log.map((item: IMessage) => {
                                return <div className="message_serial" key={item._id}>
                                    {messageIsSerial(item) ? item.raw_data : ''}
                                </div>;
                            })}
                        </div>
                    </div>
                    <div className="right column">
                        <div className="visu">
                            <div
                                className="info column">
                                <h4>Current position</h4>
                                <div className="coords row">
                                    <div className="coord">x:
                                        <span>{last ? last.x.toFixed(1) : ''}</span>
                                    </div>
                                    <div className="coord">
                                        <span>y:{last ? last.y.toFixed(1) : ''}</span>
                                    </div>
                                </div>
                                <div> phi:{last ? last.phi.toFixed(1) : ''}</div>
                            </div>
                            <BoatCanvas points={this.state.points} lastLocation={this.state.lastLocation} />
                        </div>


                        <div className="log">
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}

export default App;
