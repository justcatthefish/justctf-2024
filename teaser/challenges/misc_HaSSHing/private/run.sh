#!/usr/bin/env bash

docker build -t hasshing ./src
docker run --privileged -p1337:1337 -d hasshing
