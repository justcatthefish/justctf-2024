#!/usr/bin/env bash

export MAX_CORES=50
export FLAG="justCTF{N3tw0rk-le3ss-xsle4ks}"
export TIMEOUT=10000

docker compose -p manager -f docker-compose.yml rm -f --stop
docker compose -p manager -f docker-compose.yml build
docker compose -p manager -f docker-compose.yml up -d