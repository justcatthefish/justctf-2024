#!/usr/bin/env bash

export FLAG="justCTF{Th4t_sp3ll_looks_d4ngerous...keep_y0ur_distance}"

docker compose -p manager -f docker-compose.yml rm -f --stop
docker compose -p manager -f docker-compose.yml build
docker compose -p manager -f docker-compose.yml up -d
