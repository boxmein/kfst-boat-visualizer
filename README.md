# kfst-boat-visualizer

Cyberphysical systems class task: visualizing boat movements in a graphical interface as well as logging control messages

![image](https://user-images.githubusercontent.com/358714/58440743-0cac5f00-80e5-11e9-8a8e-3b24efc3b5df.png)


This implementation is a web app based on Create React App as well as Python 3, Flask and Socket.IO.

## Supported operating systems

- Raspbian Stretch (Raspberry Pi) - production mode
- Linux, macOS - developer mode

## Usage

### Prerequisites on Raspberry Pi / Deployment Machine

**First**, make sure that the Base Station and Programmer are attached to your computer 
via USB. "m.1" should be powered on from battery, and "kana_1" and "iris_1" should be
powered on from the computer's USB port. "m.1" should have a blinking green light,
"kana_2" should have red and green, and "iris1" all three LEDs (red, orange, green) should blink.

**Second**, make sure the configuration is correct in config.yml. Use `lsusb` and `ls /dev/tty*` to discover
the right serial device. The default baud rate is 57200.

**Third**, make sure that the serial device is correctly connected and your user has
non-root read access to it. To check that, do `ls -l /dev/ttyX` where the X is the right serial device.
The permissions should allow your user or group to read the serial device.

To add these permissions, check the group of the tty file (most likely dialout), add the group to your user and
make a new terminal / relogin.

The access requirement can be worked around by running as Root.

### Starting on Raspberry Pi / Production Mode

In Production, the visualizer runs as a Docker image started by one shell script.

Without downloading the entire repository, download only the [deployment/start.sh script](https://github.com/boxmein/kfst-boat-visualizer/blob/master/deployment/start.sh)
and run it on the Raspberry Pi.

To download automatically, run these commands:

    wget -O start.sh https://raw.githubusercontent.com/boxmein/kfst-boat-visualizer/master/deployment/start.sh
    chmod +x start.sh

To run the visualizer:

    ./start.sh

To view the visualizer, open http://localhost:5000 on the Raspberry Pi.

The same visualizer can be viewed from the LAN by using a web browser to navigate to (raspberry pi IP):5000.

If the Raspberry Pi is connected via ethernet, use this command to get the LAN IP address:

```
ifconfig eth0 | grep inet
```

If the Raspberry Pi is connected via wlan, use this command to get the Wi-Fi IP address:

```
ifconfig wlan0 | grep inet
```

#### Updating to latest version

When the visualizer has been updated, you can download the latest version using the same start script:

    UPDATE=true ./start.sh


### Starting Developer Mode

The developer mode has the following prerequisites:

- Node.js https://nodejs.org
- Yarn https://yarnpkg.com
- Python 3
- Pip

To work on the source code of the visualizer, make modifications etc, you should run it in Developer Mode.

Use the following script to start up everything in developer mode:

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
sudo python3 server/main.py --test
```

And these commands to run the frontend separately:

```bash
cd frontend
yarn start
```

## Configuration

### With docker / prod mode

The production mode can be configured by two command-line arguments.

To change the serial device and baud rate that the radio listener is connected to:

```
./start.sh SERIAL_DEVICE BAUD_RATE
```

### In developer mode

In developer mode, it's possible to configure the backend like this:

```
python3 server/main.py -b BAUD_RATE -d SERIAL_DEVICE
```

### In developer mode, with a config file

In developer mode, as a fallback to the command line flags, a configuration file can be used and the CLI flags can be left out completely.

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
