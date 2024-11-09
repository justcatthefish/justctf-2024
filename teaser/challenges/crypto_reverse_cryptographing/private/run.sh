#!/usr/bin/env bash

docker build -t reverse_cryptographing ./src
docker run -e 'FLAG=justCTF{y4d_yyyyPP4h_r333bMer_yAwl4__krr4d_5i_yaD_n3w}' --rm --name reverse_cryptographing --privileged -p1337:1337 -d reverse_cryptographing
