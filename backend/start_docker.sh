#! /bin/bash

set -e -x

SCRIPT_DIR=$(dirname $(realpath $0))

cd $SCRIPT_DIR

REPO=backend
TAG=backend-test
docker build -t ${REPO}:${TAG} .

docker rm -f $REPO || true
docker run -t -i --name $REPO -p 4000:4000 ${REPO}:${TAG}
