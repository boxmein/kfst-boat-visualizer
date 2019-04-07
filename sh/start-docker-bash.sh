#!/bin/bash
set -x

exec docker run -it --privileged -p 5000:5000 -e "SERIAL_DEVICE=${1:-/dev/ttyUSB0}" -e "BAUDRATE=${2:-57600}" boxmein/kfst-boat-visualizer bash

