export interface IPingMessage {
    _id: number;
    type: 'ping';
}

export interface ISerialMessage {
    _id: number;
    type: 'serial';
    msg: number;
    raw_data: string;
    parsed: object;
}

export type IMessage = IPingMessage | ISerialMessage;
