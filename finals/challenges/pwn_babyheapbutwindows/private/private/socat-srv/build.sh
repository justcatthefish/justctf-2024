#!/usr/bin/env bash

set -ex

OUT=${1-.}
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o "$OUT"/socat-srv.exe ./...
