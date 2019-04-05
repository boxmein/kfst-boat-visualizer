from threading import Thread

from flask import Flask
from flask_socketio import SocketIO

from serial_reader import reader

##
## Web app setup
##

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hunter2'
sio = SocketIO(app)

@app.route("/")
def indexpage():
    return 'Hello, world'

##
## Background task: serial-to-SIO bridge
##

def serial_listener(sio):
    id_ticker = 0
    def tick(message_type, packet_raw_data, additional_data={}):
        nonlocal id_ticker
        print("+ serial message received")
        id_ticker += 1

        message = {
            '_id': id_ticker,
            'type': message_type,
            'raw_data': packet_raw_data.hex(),
            'contents': additional_data
        }

        sio.emit('message', message)

    print("+ subscribing to serial")
    reader(tick)


serial_thread = Thread(target=serial_listener, args=(sio,))
serial_thread.daemon = True

##
## Entry point
##

if __name__ == '__main__':
    print("+ starting bg task")
    serial_thread.start()
    print("+ starting app")
    sio.run(app)