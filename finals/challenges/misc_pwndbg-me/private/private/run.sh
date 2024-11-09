#!/usr/bin/env bash

docker build -t chall_pwndbg_me -f ./chall/Dockerfile ./chall/

docker compose -p pwndbg_me_instancer -f docker-compose.yml rm -f --stop
docker compose -p pwndbg_me_instancer -f docker-compose.yml build
docker compose -p pwndbg_me_instancer -f docker-compose.yml up -d
