#!/usr/bin/env bash

export FLAG="justCTF{it_is_not_forbidd3n_if_it_is_w3ll_hidd3n!}"

docker compose -p manager -f docker-compose.yml rm -f --stop
docker compose -p manager -f docker-compose.yml build
docker compose -p manager -f docker-compose.yml up -d
