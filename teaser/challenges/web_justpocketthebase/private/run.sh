#!/usr/bin/env bash
export ADMIN_PASSWORD=n8RwByBAMRxSm9fIQHuoRwZY5vWs4cfpQulxTigqsHdKT0IHVp
export FLAG_PASSWORD=aDNFeW2RZ65vweTvkbbPFo7DfMh1Rs4wg8fYvvcvu9nG8Mc0R5
export FLAG='justCTF{97603333-6596-43fe-aef8-a134c1cc11b4}'
cd src
docker compose -f docker-compose.yml rm -f --stop
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
