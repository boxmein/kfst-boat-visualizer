import React, {PureComponent} from 'react';
import subscribe from './socket-listener';
import {IMessage, ISerialMessage, IStatusMessage} from './interfaces';
import logo from './Taltech.png';


import {scan, filter, map} from 'rxjs/operators';

import './App.css';
import {BoatCanvas} from "./BoatCanvas";

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
        obs.subscribe((message: IMessage) => {
            if (messageIsStatus(message)) {
                this.setState({
                    status: message.text,
                });
            }
        });

        arrayObs.subscribe((eventLog) => {
            this.resetOffline();
            const points = eventLog
                    .filter((message: IMessage) => messageIsSerial(message) && message.msg === 1)
                    .map((message) => (message as ISerialMessage).parsed as ILastLocation)
                // .map((message) => {
                //     if (!this.state.lastLocation) {
                //         return message;
                //     }
                //     const init_x = message.x;
                //     const init_y = message.y;
                //     const stp_x = message.sp_x;
                //     const stp_y = message.sp_y;
                //     const newCoords = {
                //         ...message,
                //         x: (init_x - this.state.lastLocation.x) * zoom + 400,
                //         y: (init_y - this.state.lastLocation.y) * zoom + 400,
                //         sp_x: 0,
                //         sp_y: 0,
                //
                //     }
                //     if (stp_x && stp_y && this.state.lastLocation.sp_x && this.state.lastLocation.sp_y) {
                //         newCoords.sp_x = (stp_x - this.state.lastLocation.sp_x) * zoom + 400;
                //         newCoords.sp_y = (stp_y - this.state.lastLocation.sp_y) * zoom + 400;
                //     }
                //     return newCoords;
                //
                //
                // })

            ;
            this.setState({log: eventLog, points});

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

                            <BoatCanvas/>
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
