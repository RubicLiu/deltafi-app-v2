### Build docker image and deploy to k8s
```
# Login to docker registry
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 077918681028.dkr.ecr.us-west-2.amazonaws.com

# dev
bash deploy/build_dev.sh
k8s-cli apply -f deploy/dev/main.json.jsonnet
aws cloudfront create-invalidation --distribution-id EMMZFE0LXPFM7 --paths "/*"

# prod
bash deploy/build_prod.sh
k8s-cli apply -f deploy/prod/main.json.jsonnet
aws cloudfront create-invalidation --distribution-id EIGCOL5NJN4HY --paths "/*"
```
