#!/bin/bash
set -e 

export PORT=${PORT:-4123}
cd frontend
yarn

exec yarn start
