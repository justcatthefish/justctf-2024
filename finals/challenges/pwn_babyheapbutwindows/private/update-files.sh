#!/usr/bin/env bash

set -ex
SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

# update public
cp -f "$SCRIPT_DIR"/private/chall/note.c "$SCRIPT_DIR"/public/note.c
cp -f "$SCRIPT_DIR"/private/chall/note.exe "$SCRIPT_DIR"/public/note.exe

# update oem
cp -f "$SCRIPT_DIR"/private/socat-srv/socat-srv.exe "$SCRIPT_DIR"/private/windows-create-img/oem/chall/socat-srv.exe
cp -f "$SCRIPT_DIR"/private/chall/note.c "$SCRIPT_DIR"/private/windows-create-img/oem/chall/note.c
cp -f "$SCRIPT_DIR"/private/chall/note.exe "$SCRIPT_DIR"/private/windows-create-img/oem/chall/note.exe

# update oem
cp -f "$SCRIPT_DIR"/private/socat-srv/socat-srv.exe "$SCRIPT_DIR"/private/windows-create-img-guest/oem/chall/socat-srv.exe
cp -f "$SCRIPT_DIR"/private/chall/note.c "$SCRIPT_DIR"/private/windows-create-img-guest/oem/chall/note.c
cp -f "$SCRIPT_DIR"/private/chall/note.exe "$SCRIPT_DIR"/private/windows-create-img-guest/oem/chall/note.exe
