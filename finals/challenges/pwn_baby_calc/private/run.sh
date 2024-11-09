#!/usr/bin/env bash

docker build -t calc ./src
docker stop calc
docker run --privileged -p1337:1337 --rm --name calc -d calc
