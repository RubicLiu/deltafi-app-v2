import { Router } from 'express';
import * as GateApi from "gate-api";

import fullDeployConfigV2 from "./fullDeployConfigV2.json";

const config = fullDeployConfigV2['mainnet-test'];
const gateApiClient = new GateApi.ApiClient();
const spotApi = new GateApi.SpotApi(gateApiClient);

const routes = Router();

routes.get('/pools', (_, response) => {
  return response.json(config.poolInfoList);
});

routes.get('/spot/tickers/:currencyPair', async (request, response) => {
  const currencyPair = request.params.currencyPair;
  try {
    const result = await spotApi.listTickers({ currencyPair });
    return response.json(result.body);
  } catch (e) {
    console.error(e);
    return response.status(500).send('Failed to fetch data from gate api');
  }
});

routes.get('/spot/candlesticks/:currencyPair', async (request, response) => {
  const currencyPair = request.params.currencyPair;
  try {
    const result = await spotApi.listCandlesticks(currencyPair, {
      interval: "30m",
    });
    return response.json(result.body);
  } catch (e) {
    console.error(e);
    return response.status(500).send('Failed to fetch data from gate api');
  }
});

export default routes;
