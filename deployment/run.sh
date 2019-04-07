#!/bin/bash
set -x

# Check and warn about not running on Raspberry Pi
IS_RASPBIAN=$([[ $(lsb_release -a | grep "Distributor") == *Raspbian* ]])

if [[ $IS_RASPBIAN ]]; then
  echo "This script should only be run on a Raspberry Pi."
  echo "Automatically installing Docker will fail if not on a Debian-like system."
fi

# Check and auto install Docker if missing
if ! command -v docker >/dev/null 2>/dev/null; then
  if [[ $IS_RASPBIAN ]]; then
    echo "Automatically installing Docker..."
    curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
  else
    echo "Docker is missing"
    exit 1
  fi
fi

exec docker run --privileged boxmein/kfst-boat-visualizer

