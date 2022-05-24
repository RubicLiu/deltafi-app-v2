#! /bin/bash

set -e -x

REGISTRY=077918681028.dkr.ecr.us-west-2.amazonaws.com/deltafi-dev
TAG=`git rev-parse --short HEAD`-`date +%Y%m%d-%H%M%S`

SCRIPT_DIR=$(dirname $(realpath $0))
cd $SCRIPT_DIR/..

cp src/anchor/fullDeployConfigV2.json backend/src

yarn install
yarn build-dev

REPO=deltafi-app-v2/frontend
docker build -t ${REPO}:${TAG} --platform linux/amd64 .
docker tag ${REPO}:${TAG} ${REGISTRY}/${REPO}:${TAG}
docker push ${REGISTRY}/${REPO}:${TAG}

REPO=deltafi-app-v2/backend
docker build -t ${REPO}:${TAG} --platform linux/amd64 backend
docker tag ${REPO}:${TAG} ${REGISTRY}/${REPO}:${TAG}
docker push ${REGISTRY}/${REPO}:${TAG}
