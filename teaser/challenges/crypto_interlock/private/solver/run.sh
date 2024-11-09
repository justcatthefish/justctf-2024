#!/bin/bash

if [ "$#" -le 1 ]; then
    echo "Use: <host> <port>"
    exit 1
fi

docker build -t interlock-solver .
docker run --rm -it --network=host interlock-solver python /home/solve.py "HOST=$1" "PORT=$2" $@
