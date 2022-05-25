import { Router } from 'express';
import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import * as GateApi from "gate-api";

import fullDeployConfigV2 from "./fullDeployConfigV2.json";

const config = fullDeployConfigV2['mainnet-test'];
const gateApiClient = new GateApi.ApiClient();
const spotApi = new GateApi.SpotApi(gateApiClient);

const cacheTtlInSecs = 60;
const tickersCache = new CacheContainer(new MemoryStorage())
const candlesticksCache = new CacheContainer(new MemoryStorage())

const routes = Router();

routes.get('/api/pools', (_, response) => {
  return response.json(config.poolInfoList);
});

routes.get('/api/spot/tickers/:currencyPair', async (request, response) => {
  const currencyPair = request.params.currencyPair;
  const cachedTickers = await tickersCache.getItem(currencyPair);
  if (cachedTickers) {
    return response.json(cachedTickers);
  }

  try {
    const result = await spotApi.listTickers({ currencyPair });
    tickersCache.setItem(currencyPair, result.body, {ttl: cacheTtlInSecs});
    return response.json(result.body);
  } catch (e) {
    console.error(e);
    return response.status(500).send('Failed to fetch data from gate api');
  }
});

routes.get('/api/spot/candlesticks/:currencyPair', async (request, response) => {
  const currencyPair = request.params.currencyPair;
  const cachedCandleSticks = await candlesticksCache.getItem(currencyPair);
  if (cachedCandleSticks) {
    return response.json(cachedCandleSticks);
  }

  try {
    const result = await spotApi.listCandlesticks(currencyPair, {
      interval: "30m",
    });
    candlesticksCache.setItem(currencyPair, result.body, {ttl: cacheTtlInSecs});
    return response.json(result.body);
  } catch (e) {
    console.error(e);
    return response.status(500).send('Failed to fetch data from gate api');
  }
});

export default routes;
