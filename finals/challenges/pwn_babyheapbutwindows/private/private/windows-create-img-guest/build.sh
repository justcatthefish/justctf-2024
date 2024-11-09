#!/usr/bin/env bash

set -ex

# verify aws s3 (apt install awscli) (aws configure)
aws --version

PWD=$(pwd)
SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

OEM_DIRTMP=$(mktemp -d)
# clone oem
cp -rf ./oem/* "$OEM_DIRTMP"

## make socat-srv.exe
## make note.exe

# download some 'deps'
wget -O "$OEM_DIRTMP"/windbg.msixbundle https://windbg.download.prss.microsoft.com/dbazure/prod/1-2407-24003-0/windbg.msixbundle
wget -O "$OEM_DIRTMP"/llvm-mingw-20240917-ucrt-x86_64.zip https://github.com/mstorsjo/llvm-mingw/releases/download/20240917/llvm-mingw-20240917-ucrt-x86_64.zip

# make image
docker run --rm \
    -v "$OEM_DIRTMP":/oem \
    -v "$PWD"/storage:/storage \
    -p 28006:8006 \
    -p 23389:3389/tcp \
    -p 23389:3389/udp \
    --device=/dev/kvm \
    --cap-add NET_ADMIN \
    --stop-timeout 120 \
    dockurr/windows@sha256:9490bcb2463c666a3c0b8497f97a9ab28186e67ff63614e510ecfcab96889a98

# cleanup
rm -rf "$OEM_DIRTMP" || true

# parts
tar cSvf windows_vm_sparse.tar ./storage
split -b 1G windows_vm_sparse.tar windows_vm_sparse.tar_

# check sum (copy result into public/checksum.md
sha256sum windows_vm_sparse.tar*

# upload
# aws configure
export AWS_STORAGE_BUCKET_NAME=jctfpro
export AWS_ENDPOINT_URL_S3=https://ams3.digitaloceanspaces.com
FOLDER="win-a795880f-7ea7-4d56-abfc-c1fdbb10e3c1"

for part in windows_vm_sparse.tar_*; do
    aws s3 cp "$part" "s3://$AWS_STORAGE_BUCKET_NAME/$FOLDER/$part" --acl public-read
done
