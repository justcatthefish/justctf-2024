#!/bin/bash

docker build -t interlock .
docker run --privileged -p7331:7331 -d interlock
