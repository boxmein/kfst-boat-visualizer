# kfst-boat-visualizer

Cyberphysical systems class task: visualizing boat movements in a graphical interface as well as logging control messages

This implementation is a web app based on Create React App as well as Python 3, Flask and Socket.IO.

## Supported operating systems

- Raspbian
- Linux
- macOS

## Prerequisites

- Node.js https://nodejs.org
- Yarn https://yarnpkg.com
- Python 3
- Pip
- Pipenv (pip install --user pipenv)

## Usage

**First**, make sure that the Base Station and Programmer are attached to your computer 
via USB. "m.1" should be powered on from battery, and "kana_1" and "iris_1" should be
powered on from the computer's USB port. "m.1" should have a blinking green light,
"kana_2" should have red and green, and "iris1" all three LEDs (red, orange, green) should blink.

**Second**, make sure the configuration is correct in config.yml. Use `lsusb` and `ls /dev/tty*` to discover
the right serial device. The default baud rate is 57200.

**Third**, make sure that the serial device is correctly connected and your user has
non-root read access to it. To check that, do `ls -l /dev/ttyX` where the X is the right serial device.
The permissions should allow your user or group to read the serial device.

### Starting in Production

To start in production, run the following command:

    ./deployment/run.sh

### Starting Developer Mode

A few more things have to be checked:

**First**, make sure you have the prerequisites installed.

**Second**: use the following script to start up everything in developer mode:

    ./sh/start.sh

#### Starting only backend

To start only the websocket server backend and serial listener:

    ./sh/start-only-backend.sh

#### Starting only frontend

To only start the static web app in developer mode:

    ./sh/start-only-frontend.sh

#### Testing Mode

The backend includes a "no-serial-listener" mode that disables the serial listener,
and instead feeds random packets to the frontend 5 times per second.

To start that mode:

    ./sh/start-only-backend.sh --test

#### When you do still need root access to read the serial device

Then use the following command to run the backend:

```bash
sudo $(which pipenv) run python3 server/main.py --test
```

And these commands to run the frontend separately:

```bash
cd frontend
yarn start
```

## Configuration

The configuration file looks like this:

```yaml
serial_device: 
  file: /dev/serial/by-id/usb-FTDI_FT232R_USB_UART_AH00QNMG-if00-port0
  baudrate: 57600 # NOTE: the radio is by default @ 57600 baud

```

All keys are mandatory.

The serial device is expected to exist and be readable to the user.

## WebSocket message types

Messages are sent down over WebSocket or other Socket.IO transports in JSON.

The frontend automatically connects to the endpoint and starts listening to the
messages in App.tsx.

The general shape of the message is:

```
_id: number
type: string
... other parameters
```

The _id is just an always-incrementing integer that is unique per message.
The type differentiates between serial and ping messages.

### Ping

The message is just a "ping" test message. No reply is expected.

```json
{ "_id": 1, "type": "ping" }
```

### Serial message

This is a message from the serial endpoint. No reply is expected.

A few extra fields are added:

```
msg: number
raw_data: string
parsed: object
```

Where msg is the message type (1...4), 

raw_data is the hex-encoded serial message received,

parsed is the parsed "meaning" from the serial message.

#### Type 1 - State Message

The state message announces the position, rotation of the boat.

```json
{
    "type": "serial",
    "msg": 1,
    "raw_data": "aa010000000000000000a62bc3440040bcc40080bb44bdcb",
    "parsed": { 
        "x": 0,
        "y": 0,
        "phi": 1561.364013671875,
        "sp_x": -1506,
        "sp_y": 1500
    }
}
```

#### Type 2 - State Request

The state request is a node asking for the state of another node.

```json
{
    "type": "serial",
    "msg": 2,
    "raw_data": "aa02010c1e",
    "parsed": {
        "node_id": 1
    }
}
```

#### Type 4 - User Message

The user message is user customizable depending on usecase.

This message is not decoded and may be cut off wrong - no predefined length is assumed so the message may come out with different lengths.

```json
{
    "type": "serial",
    "msg": 4,
    "raw_data": "aa04020101dbab",
    "parsed": {}
}
```