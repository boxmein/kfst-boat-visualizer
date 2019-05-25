#!/bin/bash
set -e
if [[ "$DOCKER_PASSWORD" == "" ]] || [[ "$DOCKER_USERNAME" == "" ]]; then
  echo "Docker credentials not supplied, not deploying"
  exit 1
fi

echo "Logging in to Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
echo "Deploying to Docker Hub..."
docker push boxmein/kfst-boat-visualizer:latest