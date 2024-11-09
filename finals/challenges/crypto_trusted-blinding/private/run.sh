#!/usr/bin/env bash

cp .env src/
cd src/
docker compose up -d --build
