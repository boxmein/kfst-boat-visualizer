import React, { PureComponent } from 'react';
import subscribe from './socket-listener';
import { IMessage } from './interfaces';

interface IAppState {
  log: IMessage[];
  maxEvents: number;
}

class App extends PureComponent<{}, IAppState> {
  state: IAppState = {
    log: [],
    maxEvents: 100,
  };

  addEventToLog(event: IMessage) {
    const newLog = Array.from(this.state.log);
    newLog.unshift(event);
    newLog.slice(0, this.state.maxEvents);
    this.setState({ log: newLog });
  }
  componentDidMount() {
    console.log('App mounted');
    const obs = subscribe();
    obs.subscribe((event) => {
      console.log('Event', event);
      this.addEventToLog(event);
    });
  }
  render() {
    return (
      <div className="App">
        {this.state.log.map((item: IMessage) => (
          <div className="message" key={item._id}>
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
    );
  }
}

export default App;
