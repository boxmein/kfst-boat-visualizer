from threading import Thread
from queue import Queue
import time
import argparse
from random import sample

from flask import Flask
from flask_socketio import SocketIO

from serial_reader import reader
from config import load_config

##
## Command line arguments
##

parser = argparse.ArgumentParser()
parser.add_argument("-d", "--serial_device", help="The serial device to listen for data on", type=str)
parser.add_argument("-b", "--baudrate", help="The baud rate of the serial device", type=int)
parser.add_argument("-t", "--test", help="Enable testing mode (no serial port setup needed)", action="store_true")

##
## Web app setup
##

app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SECRET_KEY'] = 'hunter2'
sio = SocketIO(app)

# Static folder configuration will load static files from ./static/
@app.route('/')
def indexpage():
    return app.send_static_file('index.html')

##
## Configuration loader
##

def load_config_from_file():
    conf = load_config()
    filename = None
    baudrate = None
    if "serial_device" in conf:
        if "file" in conf["serial_device"]:
            filename = conf["serial_device"]["file"]

        if "baudrate" in conf["serial_device"]:
            baudrate = conf["serial_device"]["baudrate"]
    return filename, baudrate

def load_config_from_args(args):
    filename = args.serial_device
    baudrate = args.baudrate
    return filename, baudrate
    

def get_config(args):
    f_filename, f_baud = load_config_from_file()
    a_filename, a_baud = load_config_from_args(args)

    filename = '/dev/ttyUSB0'
    baud = 57600

    if f_filename is not None:
        filename = f_filename

    if a_filename is not None:
        filename = a_filename
    
    if f_baud is not None:
        baud = f_baud

    if a_baud is not None:
        baud = a_baud
    
    return filename, baud

##
## A green thread that gets the first message on the queue and sends it to the browser
## This function cannot block!
##

def serial_listener(sio, q):
    print("+ starting serial-emitter-thread")
    while True:
        try:
            message = q.get(block=False)
            print(">>>> emitting >>>>", message['raw_data'])
            sio.emit('message', message)
            sio.sleep(0.02)
        except Exception as e:
            sio.sleep(0.02)

##
## A Python thread that stuffs Serial messages into the queue
## 

def serial_thread(q, filename, baud):
    id_ticker = 0
    def tick(message_type, packet_raw_data, parsed={}):
        nonlocal id_ticker
        id_ticker += 1

        message = {
            '_id': id_ticker,
            'type': 'serial',
            'msg': message_type,
            'raw_data': packet_raw_data.hex(),
            'parsed': parsed
        }
        q.put(message)

    def emit_status(status, details=None):
        nonlocal id_ticker
        id_ticker += 1
        message = {
            '_id': id_ticker,
            'type': 'status',
            'text': status
        }
        if details is not None:
            message['details'] = details
        q.put(message)

    print("+ subscribing to serial")
    reader(filename, baud, tick, emit_status)

##
## A testing-only green thread that sends random valid messages to the Socket
##
def test_serial_listener(sio):
    id_ticker = 0
    messages = [
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000a62bc3440040bcc40080bb44bdcb","parsed":{"x":0,"y":0,"phi":1561.364013671875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000f6e9c3440040bcc40080bb443a17","parsed":{"x":0,"y":0,"phi":1567.311279296875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":2,"raw_data":"aa02010c1e","parsed":{"node_id":1}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000000eebc3440040bcc40080bb44af1d","parsed":{"x":0,"y":0,"phi":1567.345458984375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000026ecc3440040bcc40080bb44f3a8","parsed":{"x":0,"y":0,"phi":1567.379638671875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000003eedc3440040bcc40080bb440719","parsed":{"x":0,"y":0,"phi":1567.413818359375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000056eec3440040bcc40080bb44d7ab","parsed":{"x":0,"y":0,"phi":1567.447998046875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000006eefc3440040bcc40080bb444dba","parsed":{"x":0,"y":0,"phi":1567.482177734375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000086f0c3440040bcc40080bb44915d","parsed":{"x":0,"y":0,"phi":1567.516357421875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000009ef1c3440040bcc40080bb4465ec","parsed":{"x":0,"y":0,"phi":1567.550537109375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000b6f2c3440040bcc40080bb44681e","parsed":{"x":0,"y":0,"phi":1567.584716796875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000cef3c3440040bcc40080bb442f4f","parsed":{"x":0,"y":0,"phi":1567.618896484375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000eed2c4440040bcc40080bb442f26","parsed":{"x":0,"y":0,"phi":1574.591552734375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000006d4c4440040bcc40080bb44dc3b","parsed":{"x":0,"y":0,"phi":1574.625732421875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000001ed5c4440040bcc40080bb44288a","parsed":{"x":0,"y":0,"phi":1574.659912109375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000036d6c4440040bcc40080bb442578","parsed":{"x":0,"y":0,"phi":1574.694091796875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000004ed7c4440040bcc40080bb446229","parsed":{"x":0,"y":0,"phi":1574.728271484375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000066d8c4440040bcc40080bb449c12","parsed":{"x":0,"y":0,"phi":1574.762451171875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000007ed9c4440040bcc40080bb4468a3","parsed":{"x":0,"y":0,"phi":1574.796630859375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000096dac4440040bcc40080bb4412b0","parsed":{"x":0,"y":0,"phi":1574.830810546875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":2,"raw_data":"aa02010c1e","parsed":{"node_id":1}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000aedbc4440040bcc40080bb4488a1","parsed":{"x":0,"y":0,"phi":1574.864990234375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000deddc4440040bcc40080bb44fde5","parsed":{"x":0,"y":0,"phi":1574.933349609375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000f6dec4440040bcc40080bb44f017","parsed":{"x":0,"y":0,"phi":1574.967529296875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000000ee0c4440040bcc40080bb446993","parsed":{"x":0,"y":0,"phi":1575.001708984375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000026e1c4440040bcc40080bb44c4d2","parsed":{"x":0,"y":0,"phi":1575.035888671875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000003ee2c4440040bcc40080bb4490d0","parsed":{"x":0,"y":0,"phi":1575.070068359375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000056e3c4440040bcc40080bb44e0d1","parsed":{"x":0,"y":0,"phi":1575.104248046875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000006ee4c4440040bcc40080bb448b34","parsed":{"x":0,"y":0,"phi":1575.138427734375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000086e5c4440040bcc40080bb445194","parsed":{"x":0,"y":0,"phi":1575.172607421875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":2,"raw_data":"aa02010c1e","parsed":{"node_id":1}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000009ee6c4440040bcc40080bb440596","parsed":{"x":0,"y":0,"phi":1575.206787109375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000b6e7c4440040bcc40080bb44a8d7","parsed":{"x":0,"y":0,"phi":1575.240966796875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000cee8c4440040bcc40080bb44bcfc","parsed":{"x":0,"y":0,"phi":1575.275146484375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000e6e9c4440040bcc40080bb4411bd","parsed":{"x":0,"y":0,"phi":1575.309326171875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000feeac4440040bcc40080bb4445bf","parsed":{"x":0,"y":0,"phi":1575.343505859375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000016ecc4440040bcc40080bb44b6a2","parsed":{"x":0,"y":0,"phi":1575.377685546875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000002eedc4440040bcc40080bb442cb3","parsed":{"x":0,"y":0,"phi":1575.411865234375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000046eec4440040bcc40080bb44fc01","parsed":{"x":0,"y":0,"phi":1575.446044921875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000005eefc4440040bcc40080bb4408b0","parsed":{"x":0,"y":0,"phi":1575.480224609375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000076f0c4440040bcc40080bb44a3b6","parsed":{"x":0,"y":0,"phi":1575.514404296875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":2,"raw_data":"aa02010c1e","parsed":{"node_id":1}},
        {"type":"serial","msg":1,"raw_data":"aa0100000000000000008ef1c4440040bcc40080bb444e46","parsed":{"x":0,"y":0,"phi":1575.548583984375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000a6f2c4440040bcc40080bb4443b4","parsed":{"x":0,"y":0,"phi":1575.582763671875,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000bef3c4440040bcc40080bb44b705","parsed":{"x":0,"y":0,"phi":1575.616943359375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":4,"raw_data":"aa04","parsed":{}},
        {"type":"serial","msg":4,"raw_data":"aa04020101dbab","parsed":{}},
        {"type":"serial","msg":1,"raw_data":"aa010000000000000000eef5c4440040bcc40080bb44ace1","parsed":{"x":0,"y":0,"phi":1575.685302734375,"sp_x":-1506,"sp_y":1500}},
        {"type":"serial","msg":1,"raw_data":"aa01000000000000000006f7c4440040bcc40080bb440ebb","parsed":{"x":0,"y":0,"phi":1575.719482421875,"sp_x":-1506,"sp_y":1500}},

    ]
    while True:
        sampled_message = sample(messages, 1)[0]
        msg = { **sampled_message, '_id': id_ticker }
        id_ticker += 1
        print(">>>> emitting >>>> ", id_ticker )
        sio.emit('message', msg)
        sio.sleep(0.15)

##
## Entry point
##

if __name__ == '__main__':
    print("+ starting bg tasks")

    q = Queue()
    args = parser.parse_args()

    if args.test:
        print("+ TEST MODE: sending fake messages down the tube")
        sio.start_background_task(test_serial_listener, sio)
    else:
        filename, baud = get_config(args)
        serial_thread = Thread(target=serial_thread, args=(q, filename, baud))
        serial_thread.daemon = True
        serial_thread.start()
        sio.start_background_task(serial_listener, sio, q)

    print("+ starting app")
    sio.run(app)
