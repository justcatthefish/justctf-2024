#!/usr/bin/env bash

set -ex
SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

#docker buildx create --use --name insecure-builder --buildkitd-flags '--allow-insecure-entitlement security.insecure' || true
#docker buildx build --allow security.insecure --load --progress=plain -t chall_win -f "$SCRIPT_DIR"/Dockerfile "$SCRIPT_DIR"/files/
docker build --progress=plain -t chall_win -f "$SCRIPT_DIR"/Dockerfile "$SCRIPT_DIR"/files/
