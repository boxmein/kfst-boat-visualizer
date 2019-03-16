from flask import Flask
from flask_socketio import SocketIO
import rx

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

id_ticker = 0

def serial_listener():
    global id_ticker
    print("+ bg task started")
    while True:
        sio.emit('message', {
            '_id': id_ticker,
            'type': 'hello'
        })
        id_ticker = id_ticker + 1
        print("Hello emitted")
        sio.sleep(1)

##
## Entry point
##

print("+ starting bg task")
sio.start_background_task(serial_listener)

if __name__ == '__main__':
    sio.run(app)