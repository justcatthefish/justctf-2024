#!/usr/bin/env bash

curl https://s3.cdn.justctf.team/b1e4598a-9eb7-4f56-8cdc-0561b48bcbec-anomaly/anomaly.tgz --output /tmp/anomaly.tgz
tar xavf /tmp/anomaly.tgz -C /tmp/
docker build -t anomaly /tmp/private/
