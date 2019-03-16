# kfst-boat-visualizer

Cyberphysical systems class task: visualizing boat movements in a graphical interface as well as logging control msgs

This implementation is a web app based on Create React App as well as Python 3, Flask and Socket.IO on the backend.

## Prerequisites

- Node.js https://nodejs.org
- Yarn https://yarnpkg.com
- Python 3
- Pip
- Pipenv (pip install --user pipenv)

## Usage

Use the following script to start up everything in developer mode:

    ./sh/start.sh

## WebSocket message types

### Hello

The message is just a "hello" test message.

    { "_id": 1, "type": "hello" }


