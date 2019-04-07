#!/bin/bash
set -e
# The script to run in Docker so it starts properly

export LC_ALL=C.UTF-8
export LANG=C.UTF-8
pipenv sync
pipenv run python3 server/main.py -d $SERIAL_DEVICE -b $BAUDRATE

