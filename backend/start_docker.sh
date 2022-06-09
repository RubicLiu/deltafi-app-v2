#! /bin/bash

set -e -x

SCRIPT_DIR=$(dirname $(realpath $0))

cd $SCRIPT_DIR

REPO=backend
TAG=backend-test
BUILD_COMMAND=build
docker build -t ${REPO}:${TAG} --build-arg build_command=${BUILD_COMMAND} .

docker rm -f $REPO || true
docker run -t -i --name $REPO -p 4000:4000 ${REPO}:${TAG}
