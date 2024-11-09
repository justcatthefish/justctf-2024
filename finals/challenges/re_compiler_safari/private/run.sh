#!/usr/bin/env bash

docker rm -f compsafari
docker build -t compsafari ./priv
docker run --cgroupns=host --name compsafari --privileged -p20569:20569 -d compsafari
