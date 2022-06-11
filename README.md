# DeltaFi APP

An open source DeltaFi App.

## Available Scripts

Start the nodejs backend server.
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
