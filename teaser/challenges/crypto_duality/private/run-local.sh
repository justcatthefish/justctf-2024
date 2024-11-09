#!/usr/bin/env bash

docker build -t duality ./src
docker run --privileged --rm --name duality -p1337:1337 -it duality
