#!/bin/bash
set -e

if ! command -v pipenv >/dev/null 2>/dev/null; then
  echo "pipenv not installed!"
  echo "install pipenv:"
  echo "python3 -mpip install pipenv"
  exit 1
fi

if ! command -v node >/dev/null 2>/dev/null; then
  echo "node.js not installed!"
  echo "install nodejs: https://nodejs.org"
  exit 1
fi

if ! command -v yarn >/dev/null 2>/dev/null; then
  echo "yarn not installed!"
  echo "install yarn: https://yarnpkg.com"
  echo "or npm install -g yarn"
  exit 1
fi

## Set up Node.js project

cd frontend
yarn

echo "setup done! start with sh/start.sh"

