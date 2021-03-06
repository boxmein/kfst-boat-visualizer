#!/bin/bash
set -e
#if ! command -v pipenv >/dev/null 2>/dev/null; then
#  echo "pipenv not found"
#  echo "install it with python3 -mpip install --user pipenv"
#  echo "note: if you don't have pip, install it with sudo apt install python3-pip on Raspbian"
#  exit 1
#fi

# clean up before running
rm -f server.log

# install deps
# pip3 install -r requirements.txt

exec python3 server/main.py $*
