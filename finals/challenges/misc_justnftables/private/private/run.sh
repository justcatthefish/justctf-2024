#!/usr/bin/env bash

modprobe vsock
modprobe vhost_vsock

docker compose -p fw_instancer -f docker-compose.yml rm -f --stop
docker compose -p fw_instancer -f docker-compose.yml build
docker compose -p fw_instancer -f docker-compose.yml up -d
