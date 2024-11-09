#!/usr/bin/env bash

docker build -t wild_west ./src
docker run --privileged -p1337:1337 --rm --name wild_west -d wild_west
