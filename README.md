# DeltaFi APP

An open source DeltaFi App.

## Available Scripts

Start the backend server.
```
./backend/start_docker.sh
```

Install the dependencies.
```
yarn install
```

Start the webapp locally
```
yarn start
```
Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

Builds the app for production.
```
yarn build
```

Run unit tests.
```
yarn jest
```

To run test for a specific module, use
```
yarn jest -i tests/calculation.test.ts
```

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
