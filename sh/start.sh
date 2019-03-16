#!/bin/bash
set -e
if ! command -v pipenv >/dev/null 2>/dev/null; then
  echo "pipenv not found"
  echo "install it with python3 -mpip install --user pipenv"
  exit 1
fi

if ! command -v yarn >/dev/null 2>/dev/null; then
  echo "yarn not found"
  echo "install it: https://yarnpkg.com"
  echo "or: npm install -g yarn"
  exit 1
fi

export FLASK_APP=./server/main.py
export FLASK_ENV=${FLASK_ENV:-development}
pipenv run python3 server/main.py &
flask_pid=$!

cd frontend
yarn
yarn start &
react_pid=$!

trap "kill $flask_pid $react_pid" INT

wait $react_pid
kill $flask_pid