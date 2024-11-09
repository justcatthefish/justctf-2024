#!/usr/bin/env bash

# kill running containers
DOCKERS_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep "sandbox_win_") || true
if [ -z "$DOCKERS_CONTAINERS" ]; then
  echo "no containers to kill"
else
  echo "killing"
  docker kill $DOCKERS_CONTAINERS
fi;
