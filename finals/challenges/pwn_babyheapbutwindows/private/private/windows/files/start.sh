#!/usr/bin/env bash

#set -e

dockerd --storage-driver=btrfs $DOCKER_DAEMON_ARGS >/dev/null 2>&1 &

(( timeout = 60 + SECONDS ))
until docker info >/dev/null 2>&1
do
    if (( SECONDS >= timeout )); then
        echo 'Timed out trying to connect to internal docker host.' >&2
        exit 1
    fi
    sleep 1
done

echo -ne 'The VM will be up in a few minutes (1-3 minutes). Please be patient.\n\r\n'

docker load -i ./image.tar >/dev/null 2>&1
docker tag 333c77b3f257 dockurr/windows

docker run -d \
    --pull=never \
    --rm \
    -v /storage:/storage \
    -p 1337:1337 \
    --device=/dev/kvm \
    --cap-add NET_ADMIN \
    --stop-timeout 120 \
    dockurr/windows >/dev/null 2>&1

# healthcheck if note.exe is up
while true; do
  socat_output=$((echo -e "5\n"; sleep 1) | socat - tcp-connect:127.0.0.1:1337,retry=180,interval=0.2 2>/dev/null)
  if [[ "$socat_output" == *note* ]]; then
      break
  fi
  sleep 0.2
done

socat stdio tcp-connect:127.0.0.1:1337,retry=180,interval=0.2
