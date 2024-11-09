#!/usr/bin/env bash

set -ex
PWD=$(pwd)

# run image
docker run --rm \
    -v "$PWD"/storage:/storage \
    -v "$PWD"/shared:/shared \
    -p 21337:1337 \
    -p 28006:8006 \
    -p 23389:3389/tcp \
    -p 23389:3389/udp \
    --device=/dev/kvm \
    --cap-add NET_ADMIN \
    --stop-timeout 120 \
    dockurr/windows@sha256:9490bcb2463c666a3c0b8497f97a9ab28186e67ff63614e510ecfcab96889a98
