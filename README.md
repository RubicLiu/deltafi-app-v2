# DeltaFi APP

An open source DeltaFi App.

## Available Scripts

In the project directory, you can run:

### `yarn install`

Install relevant packages.

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn jest`

Runs the unit tests.
To run test for a specific module, for example, calculate, run `yarn jest -i tests/calculation.test.ts`

### Build docker image and deploy to k8s
```
# dev
bash deploy/build_dev.sh
k8s-cli apply -f deploy/dev/main.json.jsonnet

# prod
bash deploy/build_prod.sh
k8s-cli apply -f deploy/prod/main.json.jsonnet
```
