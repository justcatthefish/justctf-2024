#!/bin/bash

docker build -t reverse_cryptographing .
docker run --privileged -p1337:1337 -d reverse_cryptographing
