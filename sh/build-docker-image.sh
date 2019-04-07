#!/bin/bash
set -e

# Builds the Docker image used for deployment


# Ensure we are at the top folder of the project
if command -v git >/dev/null 2>/dev/null; then
  cd $(git rev-parse --show-toplevel)
else
  echo "NOTE: make sure this command is run in the top folder of the project!"
fi

exec docker build -t boxmein/kfst-boat-visualizer .
