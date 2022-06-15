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
import { getPythMarketPriceTuple, getSymbolToPythPriceData, SymbolToPythPriceData } from "anchor/pyth_utils";

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

export function getPythMarketPrice(symbolToPythPriceData: SymbolToPythPriceData, poolConfig: PoolConfig) {
    const marketPriceTuple = getPythMarketPriceTuple(
      symbolToPythPriceData,
      poolConfig?.base,
      poolConfig?.quote,
    );

    const basePrice = getPythPrice(symbolToPythPriceData, poolConfig.base);
    const quotePrice = getPythPrice(symbolToPythPriceData, poolConfig.quote);

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
  result = {
    price: priceData.price,
    confidenceInterval: priceData.confidence,
  };

  // if the price and confidence interval are both not undefined, price should be greater than confidence interval
  validate(
    !(result.price && result.confidenceInterval) || result.price > result.confidenceInterval,
    "confidence interval should not be larger than the price",
  );
  return result;
}
