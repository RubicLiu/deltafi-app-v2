#! /bin/bash

set -e -x

SCRIPT_DIR=$(dirname $(realpath $0))

export BUILD_COMMAND=build
export REGISTRY=077918681028.dkr.ecr.us-west-2.amazonaws.com
export TAG=prod-`git rev-parse --short HEAD`-`date +%Y%m%d-%H%M%S`
$SCRIPT_DIR/build_docker.sh

echo -n $TAG > $SCRIPT_DIR/prod/tag.txt

jsonnet-cli render -f $SCRIPT_DIR
