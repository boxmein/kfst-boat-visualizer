import React, {PureComponent} from 'react';
import subscribe from './socket-listener';
import {IMessage, ISerialMessage} from './interfaces';
import logo from './Taltech.png';

import {scan, filter, map} from 'rxjs/operators';

import './App.css';

const MAX_EVENTS = 100;

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
    points: ILastLocation[]

}

function messageIsSerial(message: IMessage): message is ISerialMessage {
    return message && message.type === 'serial';
}

class App extends PureComponent<{}, IAppState> {
    state: IAppState = {
        log: [],
        offline: false,
        points: [],
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

    componentDidMount() {
        console.log('App mounted');
        const obs = subscribe();

        const arrayObs = obs.pipe(
            scan((acc: IMessage[], current: IMessage): IMessage[] => [...acc.slice(acc.length > MAX_EVENTS ? 1 : 0), current], [] as IMessage[])
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
            this.setState({
                lastLocation: message.parsed as ILastLocation
            });
        });

        arrayObs.subscribe((eventLog) => {
            this.resetOffline();
            const points = eventLog
                .filter((message: IMessage) => messageIsSerial(message) && message.msg === 1)
                .map((message) => (message as ISerialMessage).parsed as ILastLocation);
            this.setState({log: eventLog, points});

        });
    }

    render() {
        const last = this.state.lastLocation;

        return (
            <div className="App">
                <div className="header row">
                    {this.state.offline && 'Offline!'}
                </div>

                <div className="container row">


                    <div className="left column">
                        <div className="legend column">
                            <img src={logo} className="logo" alt=""/>
                            Scale of this model is <b> 1:50</b>
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
                                className="info row">x:{last ? last.x.toFixed(1) : ''} y:{last ? last.y.toFixed(1) : ''} phi:{last ? last.phi.toFixed(1) : ''}</div>
                            <div className="x"/>
                            <div className="y"/>

                            <div className="boat" style={{
                                transform:`translate(-50%, -50%) rotate(${last?last.phi+225:225}deg)`
                            }}>
                            </div>

                            <div className="previous">
                                <span className="index">i</span>
                            </div>
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
