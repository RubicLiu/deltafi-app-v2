import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { PublicKey, Connection } from "@solana/web3.js";
import { PriceData, ProductData, parsePriceData } from "@pythnetwork/client";
import BigNumber from "bignumber.js";

import {
  deployConfigV2,
  getTokenConfigBySymbol,
  PoolConfig,
  TokenConfig,
} from "constants/deployConfigV2";
import { validate } from "utils/utils";
import { getSymbolToPythPriceData, SymbolToPythPriceData } from "anchor/pyth_utils";

const MOCK_PYTH_PRODUCT_NAME_PREFIX = "Mock";

type PythData = {
  symbol: string;
  priceKey: PublicKey;
  productData: ProductData;
  priceData: PriceData;
};

export type SymbolToPythData = Record<string, PythData>;

export interface PythState {
  symbolToPythData: SymbolToPythData;
  symbolToPythPriceData: SymbolToPythPriceData;
}

const initialState: PythState = {
  symbolToPythData: {},
  symbolToPythPriceData: {},
};

export const fetchPythDataThunk = createAsyncThunk(
  "v2/fetchPythData",
  async (connection: Connection) => {
    const symbolToPythData: SymbolToPythData = {};
    try {
      const pythTokenInfoList = [];
      for (const tokenInfo of deployConfigV2.tokenInfoList) {
        if (!tokenInfo.pyth.productName.startsWith(MOCK_PYTH_PRODUCT_NAME_PREFIX)) {
          pythTokenInfoList.push(tokenInfo);
        }
      }
      const pythDataList = await getPythDataList(connection, pythTokenInfoList);
      for (const pythData of pythDataList) {
        symbolToPythData[pythData.symbol] = pythData;
      }
      const symbolToPythPriceData = await getSymbolToPythPriceData(
        connection,
        deployConfigV2.tokenInfoList,
      );
      return {
        symbolToPythData,
        symbolToPythPriceData,
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
);

export const pythAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchPythDataThunk.fulfilled, (state, action) => {
    state.symbolToPythData = action.payload.symbolToPythData;
    state.symbolToPythPriceData = action.payload.symbolToPythPriceData;
  });
});

async function getPythDataList(connection: Connection, tokenInfoList: TokenConfig[]) {
  const pythPriceKeys = tokenInfoList.map(({ pyth }) => new PublicKey(pyth.price));

  const priceInfos = await connection.getMultipleAccountsInfo(pythPriceKeys, "confirmed");
  const pythDataList = [];
  for (let i = 0; i < priceInfos.length; i++) {
    const priceKey = pythPriceKeys[i];
    const priceData = parsePriceData(priceInfos[i].data as Buffer);
    const symbol = tokenInfoList[i].symbol;
    pythDataList.push({
      priceKey,
      symbol,
      priceData,
    });
  }
  return pythDataList;
}

export function getPythPriceBySymbol(
  symbolToPythData: SymbolToPythData,
  tokenSymbol: string | null | undefined,
) {
  let result = { priceData: null, priceAccountKey: null, price: null, confidenceInterval: null };
  if (!tokenSymbol) {
    return result;
  }

  const tokenInfo = getTokenConfigBySymbol(tokenSymbol);
  if (tokenInfo && tokenInfo.pyth.productName.startsWith(MOCK_PYTH_PRODUCT_NAME_PREFIX)) {
    return {
      price: tokenInfo.pyth.mockPrice,
      confidenceInterval: 0,
    };
  }

  if (!symbolToPythData[tokenSymbol]) {
    return result;
  }

  const priceData = symbolToPythData[tokenSymbol].priceData;
  result.priceData = priceData;
  result.priceAccountKey = symbolToPythData[tokenSymbol].priceKey;
  result.price = priceData.price ? priceData.price : priceData.previousPrice;
  result.confidenceInterval = priceData.price ? priceData.confidence : priceData.previousConfidence;

  // if the price and confidence interval are both not undefined, price should be greater than confidence interval
  validate(
    !(result.price && result.confidenceInterval) || result.price > result.confidenceInterval,
    "confidence interval should not be larger than the price",
  );
  return result;
}

export function getPythMarketPrice(symbolToPythData: SymbolToPythData, poolConfig: PoolConfig) {
  const { price: basePrice, confidenceInterval: baseConfidenceInterval } = getPythPriceBySymbol(
    symbolToPythData,
    poolConfig?.base,
  );
  const { price: quotePrice, confidenceInterval: quoteConfidenceInterval } = getPythPriceBySymbol(
    symbolToPythData,
    poolConfig?.quote,
  );
  const marketPrice =
    basePrice && quotePrice ? new BigNumber(basePrice / quotePrice) : new BigNumber(NaN);
  const marketPriceLow =
    basePrice && quotePrice && baseConfidenceInterval && quoteConfidenceInterval
      ? new BigNumber((basePrice - baseConfidenceInterval) / (quotePrice + quoteConfidenceInterval))
      : new BigNumber(NaN);
  const marketPriceHigh =
    basePrice && quotePrice && baseConfidenceInterval && quoteConfidenceInterval
      ? new BigNumber((basePrice + baseConfidenceInterval) / (quotePrice - quoteConfidenceInterval))
      : new BigNumber(NaN);

  return {
    marketPrice,
    basePrice,
    quotePrice,
    marketPriceLow,
    marketPriceHigh,
  };
}
