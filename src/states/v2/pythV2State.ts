import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { PublicKey, Connection } from "@solana/web3.js";
import { PriceData, ProductData, parsePriceData } from "@pythnetwork/client";
import BigNumber from "bignumber.js";

import { getMultipleAccounts } from "utils/account";
import { deployConfigV2 } from "constants/deployConfigV2";
import { validate } from "utils/utils";

type PythData = {
  symbol: string;
  priceKey: PublicKey;
  productData: ProductData;
  priceData: PriceData;
};
type SymbolToPythData = Record<string, PythData>;

export interface PythState {
  symbolToPythData: SymbolToPythData;
}

const initialState: PythState = {
  symbolToPythData: {},
};

export const fetchPythDataV2Thunk = createAsyncThunk(
  "v2/fetchPythData",
  async (connection: Connection) => {
    const symbolToPythData: SymbolToPythData = {};
    const pythDataList = await getPythDataList(connection);
    for (const pythData of pythDataList) {
      symbolToPythData[pythData.symbol] = pythData;
    }
    return {
      symbolToPythData,
    };
  },
);

export const pythV2Reducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchPythDataV2Thunk.fulfilled, (state, action) => {
    state.symbolToPythData = action.payload.symbolToPythData;
  });
});

async function getPythDataList(connection: Connection) {
  const tokenInfoList = deployConfigV2.tokenInfoList;
  const pythPriceKeys = tokenInfoList.map(({ pyth }) => new PublicKey(pyth.price));
  const priceInfos = await getMultipleAccounts(connection, pythPriceKeys, "confirmed");
  const pythDataList = [];
  for (let i = 0; i < priceInfos.keys.length; i++) {
    const priceKey = priceInfos.keys[i];
    const priceData = parsePriceData(priceInfos.array[i].data as Buffer);
    const symbol = tokenInfoList[i].symbol;
    console.info("pyth", symbol, priceData);
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

export function getPythMarketPrice(symbolToPythData: SymbolToPythData, poolInfo) {
  const { price: basePrice, confidenceInterval: baseConfidenceInterval } = getPythPriceBySymbol(
    symbolToPythData,
    poolInfo.base,
  );
  const { price: quotePrice, confidenceInterval: quoteConfidenceInterval } = getPythPriceBySymbol(
    symbolToPythData,
    poolInfo.quote,
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
