#!/usr/bin/env bash

export FLAG="justCTF{Ott3r_uses_expl0it_its_sup3r_eff3ctiv3}"

docker compose -p manager -f docker-compose.yml rm -f --stop
docker compose -p manager -f docker-compose.yml build
docker compose -p manager -f docker-compose.yml up -d
