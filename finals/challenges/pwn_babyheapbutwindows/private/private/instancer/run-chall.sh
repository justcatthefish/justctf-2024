#!/usr/bin/env bash

RANDID=$1

# inside there is another dockerd so "privileged" is needed
# better is making another dockerd layer to make less networking issues :)
docker run \
  --privileged \
  --pull=never \
  --network none \
  --rm \
  --name "sandbox_win_$RANDID" \
  -i chall_win
