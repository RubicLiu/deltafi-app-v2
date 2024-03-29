import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection } from "@solana/web3.js";

import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { validate } from "utils/utils";
import {
  getPythMarketPriceTuple,
  getSymbolToPythPriceData,
  SymbolToPythPriceData,
} from "anchor/pyth_utils";

export interface PythState {
  symbolToPythPriceData: SymbolToPythPriceData;
}

const initialState: PythState = {
  symbolToPythPriceData: {},
};

export const fetchPythDataThunk = createAsyncThunk(
  "v2/fetchPythData",
  async (connection: Connection) => {
    try {
      const symbolToPythPriceData = await getSymbolToPythPriceData(
        connection,
        deployConfigV2.tokenInfoList,
      );
      return {
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
    state.symbolToPythPriceData = action.payload.symbolToPythPriceData;
  });
});

export function getPythMarketPrice(
  symbolToPythPriceData: SymbolToPythPriceData,
  poolConfig: PoolConfig,
) {
  const marketPriceTuple = getPythMarketPriceTuple(
    symbolToPythPriceData,
    poolConfig?.base,
    poolConfig?.quote,
  );

  const basePrice = getPythPrice(symbolToPythPriceData, poolConfig?.base);
  const quotePrice = getPythPrice(symbolToPythPriceData, poolConfig?.quote);

  return {
    marketPrice: marketPriceTuple?.marketPrice,
    basePrice: basePrice.price,
    quotePrice: quotePrice.price,
    marketPriceLow: marketPriceTuple?.lowPrice,
    marketPriceHigh: marketPriceTuple?.highPrice,
  };
}

export function getPythPrice(
  symbolToPythPriceData: SymbolToPythPriceData,
  tokenSymbol: string | null | undefined,
) {
  let result = { price: null, confidenceInterval: null };
  if (!tokenSymbol) {
    return result;
  }

  if (!symbolToPythPriceData[tokenSymbol]) {
    return result;
  }

  const priceData = symbolToPythPriceData[tokenSymbol];

  let price = priceData.price;
  if (!price) {
    price = priceData.previousPrice;
  }
  if (!price) {
    price = priceData.aggregate.price;
  }

  result = {
    price,
    confidenceInterval: priceData.confidence,
  };

  // if the price and confidence interval are both not undefined, price should be greater than confidence interval
  validate(
    !(result.price && result.confidenceInterval) || result.price > result.confidenceInterval,
    "confidence interval should not be larger than the price",
  );
  return result;
}
