#!/usr/bin/env bash

export MAX_CORES=32

docker compose -p manager_catnas -f docker-compose.yml rm -f --stop
docker compose -p manager_catnas -f docker-compose.yml build
docker compose -p manager_catnas -f docker-compose.yml up -d
