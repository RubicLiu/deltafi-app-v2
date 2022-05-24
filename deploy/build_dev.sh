#! /bin/bash

set -e -x

SCRIPT_DIR=$(dirname $(realpath $0))

export REGISTRY=077918681028.dkr.ecr.us-west-2.amazonaws.com/deltafi-dev
export TAG=`git rev-parse --short HEAD`-`date +%Y%m%d-%H%M%S`
$SCRIPT_DIR/build_docker.sh

echo $TAG
