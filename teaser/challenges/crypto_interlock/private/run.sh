#!/usr/bin/env bash
docker build -t interlock ./src
docker run -e 'FLAG=justCTF{p3rf3c71y_un6r34k4b13_1f_n0t_71m3_7r4v31s}' --privileged -p7331:7331 -d interlock
