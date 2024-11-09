#!/usr/bin/env bash

docker run --pull=never --rm --network none -e FLAG="$FLAG" --name "sandbox_pwndbg_me_$SRANDOM" -i chall_pwndbg_me
