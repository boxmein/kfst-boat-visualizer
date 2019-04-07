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

export interface IStatusMessage {
    _id: number;
    type: 'status';
    text: string;
    details?: string;
}

export type IMessage = IPingMessage | ISerialMessage | IStatusMessage;
