#!/usr/bin/env bash

export FLAG="justCTF{RoboOtter_built_and_r3ady_to_rul3_th3_wat3rs!}"

docker compose -p manager -f docker-compose.yml rm -f --stop
docker compose -p manager -f docker-compose.yml build
docker compose -p manager -f docker-compose.yml up -d
