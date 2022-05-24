import { Router } from 'express';
import * as GateApi from "gate-api";

import fullDeployConfigV2 from "./fullDeployConfigV2.json";

const config = fullDeployConfigV2['mainnet-test'];
const gateApiClient = new GateApi.ApiClient();

const routes = Router();

routes.get('/pools', (_, response) => {
  return response.json(config.poolInfoList);
});

routes.get('/spot/tickers/:currencyPair', (request, response) => {
  const api = new GateApi.SpotApi(gateApiClient);
  const currencyPair = request.params.currencyPair;
  api.listTickers({ currencyPair })
   .then(
     value => {
      console.log('API called successfully. Returned data: ', value.body);
      response.json(value.body)
    },
    error => {
      console.error(error);
    });
});

export default routes;
