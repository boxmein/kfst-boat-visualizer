#!/bin/bash
set -e
if ! command -v pipenv >/dev/null 2>/dev/null; then
  echo "pipenv not found"
  echo "install it with python3 -mpip install --user pipenv"
  echo "note: if you don't have pip, install it with sudo apt install python3-pip on Raspbian"
  exit 1
fi

if ! command -v node >/dev/null 2>/dev/null; then
  echo "node.js not found"
  echo "install it: https://nodejs.org"
  exit 1
fi

if ! command -v yarn >/dev/null 2>/dev/null; then
  echo "yarn not found"
  echo "install it: https://yarnpkg.com"
  echo "or: npm install -g yarn"
  exit 1
fi

# clean up before running
rm -f server.log

pipenv sync
pipenv run python3 server/main.py >server.log &
flask_pid=$!

cd frontend
yarn
yarn start &
react_pid=$!

trap "kill $flask_pid $react_pid" INT

wait $react_pid
kill $flask_pid
