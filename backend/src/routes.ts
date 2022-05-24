import { Router } from 'express';
import * as GateApi from "gate-api";

import fullDeployConfigV2 from "./fullDeployConfigV2.json";

const config = fullDeployConfigV2['mainnet-test'];
const gateApiClient = new GateApi.ApiClient();

const routes = Router();

routes.get('/pools', (_, response) => {
  return response.json(config.poolInfoList);
});

routes.get('/spot/tickers/:currencyPair', async (request, response) => {
  const api = new GateApi.SpotApi(gateApiClient);
  const currencyPair = request.params.currencyPair;
  try {
    const result = await api.listTickers({ currencyPair });
    console.info(result);
    return response.json(result.body);
  } catch (e) {
    console.error(e);
  }
  return response.json(currencyPair);
});

export default routes;
