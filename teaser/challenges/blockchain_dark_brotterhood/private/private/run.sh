#!/usr/bin/env bash

export FLAG="justCTF{I_us3d_to_b3_an_ott3r_until_i_t00k_th4t_arr0w}"

docker compose -p manager -f docker-compose.yml rm -f --stop
docker compose -p manager -f docker-compose.yml build
docker compose -p manager -f docker-compose.yml up -d
