#!/bin/bash
set -e
if ! command -v pipenv >/dev/null 2>/dev/null; then
  echo "pipenv not found"
  echo "install it with python3 -mpip install --user pipenv"
  exit 1
fi

export FLASK_APP=./server/main.py
export FLASK_ENV=${FLASK_ENV:-development}
pipenv run flask run &
flask_pid=$!

cd frontend
yarn
yarn start &
react_pid=$!

trap "kill $flask_pid $react_pid" INT

wait $flask_pid $react_pid

