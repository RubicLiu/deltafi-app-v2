#! /bin/bash

set -e -x

SCRIPT_DIR=$(dirname $(realpath $0))
cd $SCRIPT_DIR/..

cp src/anchor/fullDeployConfigV2.json backend/src

REPO=deltafi-app-v2/frontend
docker build -t ${REPO}:${TAG} --platform linux/amd64 --build-arg build_command=${BUILD_COMMAND} .
docker tag ${REPO}:${TAG} ${REGISTRY}/${REPO}:${TAG}
docker push ${REGISTRY}/${REPO}:${TAG}

REPO=deltafi-app-v2/backend
docker build -t ${REPO}:${TAG} --platform linux/amd64 --build-arg build_command=${BUILD_COMMAND} backend
docker tag ${REPO}:${TAG} ${REGISTRY}/${REPO}:${TAG}
docker push ${REGISTRY}/${REPO}:${TAG}
