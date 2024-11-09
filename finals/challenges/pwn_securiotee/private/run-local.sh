#!/usr/bin/env bash

docker build --build-arg 'FLAG=justCTF{7h3_S_1n_IoT_5tands_f0r_53cur17y_lol}' -t securiotee ./src
docker run --cgroupns=host --privileged -p1373:1373 -it securiotee
