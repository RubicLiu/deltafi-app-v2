#! /bin/bash

set -e -x

REGISTRY=077918681028.dkr.ecr.us-west-2.amazonaws.com/deltafi-dev
REPO=deltafi-app-v2/backend
TAG=backend-test

docker build -t ${REPO}:${TAG} --platform linux/amd64 backend
docker tag ${REPO}:${TAG} ${REGISTRY}/${REPO}:${TAG}
docker push ${REGISTRY}/${REPO}:${TAG}
