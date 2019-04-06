#!/bin/bash
set -e
if ! command -v pipenv >/dev/null 2>/dev/null; then
  echo "pipenv not found"
  echo "install it with python3 -mpip install --user pipenv"
  echo "note: if you don't have pip, install it with sudo apt install python3-pip on Raspbian"
  exit 1
fi


# clean up before running
rm -f server.log

export FLASK_APP=./server/main.py
export FLASK_ENV=${FLASK_ENV:-development}
pipenv run python3 server/main.py >server.log
