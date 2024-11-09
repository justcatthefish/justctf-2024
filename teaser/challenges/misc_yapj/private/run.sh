#!/usr/bin/env bash

docker build --build-arg 'FLAG=justCTF{Y0u_kn0w_th3_k3ys_to_5ucc3ss_don7_y0u}' -t pyjail ./src
docker run --cgroupns=host --privileged -p20569:20569 -d pyjail
