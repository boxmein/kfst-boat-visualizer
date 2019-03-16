import socketIOClient from 'socket.io-client';
import { Observable } from 'rxjs';
import { IMessage } from './interfaces';
const ENDPOINT = 'localhost:5000';

function validateMessage(msg: any): msg is IMessage {
    return typeof msg === 'object' &&
            typeof msg.id === 'number' &&
            typeof msg.type === 'string';
}

export default function subscribe(): Observable<IMessage> {
    const sock = socketIOClient(ENDPOINT);
    const obs = new Observable<IMessage>((subject) => {
        sock.on('message', (message: object) => {
            if (validateMessage(message)) {
                subject.next(message);
            }
        });
    });

    return obs;
}