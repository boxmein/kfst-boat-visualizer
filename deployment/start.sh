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

if [[ "$UPDATE" == "true" ]]; then
  echo "Updating to latest version..."
  docker pull boxmein/kfst-boat-visualizer:latest
fi

echo "Starting visualizer. Open http://localhost:5000 to see the result."
exec docker run -it --device ${1:-/dev/ttyUSB0} -p 5000:5000 -e "SERIAL_DEVICE=${1:-/dev/ttyUSB0}" -e "BAUDRATE=${2:-57600}" boxmein/kfst-boat-visualizer

