#!/bin/sh
echo -ne '\033c\033]0;jCTF Game\a'
base_path="$(dirname "$(realpath "$0")")"
export FLAG="$(cat flag.txt)"
"$base_path/server.x86_64" "$@"
