#!/bin/bash
set -el

# Set up Raspbian for production mode

IS_RASPBIAN=$([[ $(lsb_release -a | grep "Distributor") == *Raspbian* ]])
INSTALL_AUTOMATICALLY=${INSTALL_AUTOMATICALLY:-$IS_RASPBIAN}

if [[ $IS_RASPBIAN ]]; then
  echo "Raspbian OS detected"
fi

if [[ $INSTALL_AUTOMATICALLY ]]; then
  echo "Installing dependencies without prompting."
  echo "You may be asked for sudo password."
fi

if ! command -v docker >/dev/null 2>/dev/null; then
  if [[ $INSTALL_AUTOMATICALLY ]]; then
    curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
    sudo usermod -aG docker $(whoami)
  else
    echo "Docker not installed! Install docker please."
    echo "https://www.docker.com/"
  fi
fi

if ! command -v pipenv >/dev/null 2>/dev/null; then
  if [[ $INSTALL_AUTOMATICALLY ]]; then
    sudo apt-get -y install python3 python3-pip
    sudo pip3 install pipenv
  else
    echo "pipenv not installed!"
    echo "install pipenv:"
    echo "python3 -mpip install pipenv"
    exit 1
  fi
fi

if ! command -v node >/dev/null 2>/dev/null; then
  if [[ $INSTALL_AUTOMATICALLY ]]; then
    curl -L https://git.io/n-install | bash
    sudo ~/n/bin/n 10.15.3
  else
    echo "node.js not installed!"
    echo "install nodejs: https://nodejs.org"
    exit 1
  fi
fi

if ! command -v yarn >/dev/null 2>/dev/null; then
  if [[ $INSTALL_AUTOMATICALLY ]]; then
    sudo npm install -g yarn
  else
    echo "yarn not installed!"
    echo "install yarn: https://yarnpkg.com"
    echo "or npm install -g yarn"
    exit 1
  fi
fi


