package main

import (
	"github.com/kelseyhightower/envconfig"
	"log"
	"os"
	"time"
)

var Config *config

func init() {
	var s config
	err := envconfig.Process("", &s)
	if err != nil {
		log.Fatal(err.Error())
	}
	Config = &s

	err = os.WriteFile("/tmp/create_sandbox.sh", []byte(CreateSandboxSh), 0700)
	if err != nil {
		log.Fatal(err.Error())
	}
	err = os.WriteFile("/tmp/destroy_sandbox.sh", []byte(DestroySandboxSh), 0700)
	if err != nil {
		log.Fatal(err.Error())
	}
	err = os.WriteFile("/tmp/clean_all_sandbox.sh", []byte(CleanAllSandboxSh), 0700)
	if err != nil {
		log.Fatal(err.Error())
	}
}

const CreateSandboxSh = `#!/bin/bash

set -ex
name="$1"
port="$2"

docker run -d -e FLAG --rm --name "sandbox_block_$name" -p "127.0.0.1:$port:31337" blockchain
`

const DestroySandboxSh = `#!/bin/bash

set -ex
name="$1"

docker kill "sandbox_block_$name"
`

const CleanAllSandboxSh = `#!/bin/bash

set -ex

# kill running containers
DOCKERS_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep "sandbox_block_") || true
if [ -z "$DOCKERS_CONTAINERS" ]; then
  echo "no containers to kill"
else
  echo "killing"
  docker kill $DOCKERS_CONTAINERS
fi;
`

type config struct {
	Listen         string        `default:"0.0.0.0:31337" split_words:"true"`
	RequestTimeout time.Duration `default:"120s" split_words:"true"`
}
