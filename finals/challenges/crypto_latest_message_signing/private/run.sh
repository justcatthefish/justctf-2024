#!/usr/bin/env bash

set -o errexit

cd server_files

docker build -t crypto_latest_message_signing .
docker run -p1337:1337 -d crypto_latest_message_signing
