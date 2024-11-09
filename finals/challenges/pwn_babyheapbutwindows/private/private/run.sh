#!/usr/bin/env bash

set -ex
SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

# Z reki wykonac trzeba:
# ./windows-create-img/build.sh
# mv windows_vm_sparse.tar ./windows/files/
# ./windows/build.sh

docker compose -p win_instancer -f docker-compose.yml rm -f --stop
docker compose -p win_instancer -f docker-compose.yml build
docker compose -p win_instancer -f docker-compose.yml up -d
