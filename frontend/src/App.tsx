import React, { PureComponent } from 'react';
import subscribe from './socket-listener';
import { IMessage, ISerialMessage } from './interfaces';

import { scan, filter, map } from 'rxjs/operators';

import './App.css';

const MAX_EVENTS = 100;

interface IAppState {
  log: IMessage[];
  offline: boolean;
}

function messageIsSerial(message: IMessage): message is ISerialMessage {
  return message && message.type === 'serial';
}

class App extends PureComponent<{}, IAppState> {
  state: IAppState = {
    log: [],
    offline: false,
  };

  offlineTimeout?: number | null;

  resetOffline(): void {
    if (this.offlineTimeout) {
      window.clearTimeout(this.offlineTimeout);
    }
    this.setState({ offline: false });
    this.offlineTimeout = window.setTimeout(() => {
      this.setState({ offline: true });
    }, 5000);
  }

  componentDidMount() {
    console.log('App mounted');
    const obs = subscribe();

    const arrayObs = obs.pipe(
      scan((acc: IMessage[], current: IMessage): IMessage[] => [...acc.slice(acc.length > MAX_EVENTS ? 1 : 0), current], [] as IMessage[])
    );

    arrayObs.subscribe((eventLog) => {
      this.resetOffline();
      this.setState({ log: eventLog });
    });
  }
  render() {
    return (
      <div className="App">
        <div className="header row">
          {this.state.offline && 'Offline!'}
        </div>
        <div className="row">
          <div className="column">
            <h2>All Messages</h2>
            {this.state.log.map((item: IMessage) => (
              <div className="message" key={item._id}>
                {JSON.stringify(item)}
              </div>
            ))}
          </div>
          <div className="column">
            <h2>Raw Packets</h2>
            {this.state.log.map((item: IMessage) => {
              return <div className="message_serial" key={item._id}>
                  {messageIsSerial(item) ? item.raw_data : ''}
                </div>;
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
