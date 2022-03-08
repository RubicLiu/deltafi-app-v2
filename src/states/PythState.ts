import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { PublicKey, Connection } from "@solana/web3.js";
import { PriceData, ProductData, parseProductData, parsePriceData } from "@pythnetwork/client";

import { deployConfig } from "constants/deployConfig";
import { getMultipleAccounts } from "utils/account";

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

export const fetchPythDataThunk = createAsyncThunk(
  "pyth/fetchPythData",
  async (connection: Connection) => {
    const symbolToPythData: SymbolToPythData = {};
    const pythDataList = await getPythDataList(connection);
    console.info("found pyth data " + pythDataList.length);
    for (const pythData of pythDataList) {
      symbolToPythData[pythData.symbol] = pythData;
    }
    return {
      symbolToPythData,
    };
  },
);

export const pythReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchPythDataThunk.fulfilled, (state, action) => {
    state.symbolToPythData = action.payload.symbolToPythData;
  });
});

async function getPythDataList(connection: Connection) {
  const tokenInfo = deployConfig.tokenInfo;
  const pythProductKeys = tokenInfo.map(({ pyth }) => new PublicKey(pyth.product));
  const productsInfos = await getMultipleAccounts(connection, pythProductKeys, "confirmed");

  const pythPriceKeys = tokenInfo.map(({ pyth }) => new PublicKey(pyth.price));
  const priceInfos = await getMultipleAccounts(connection, pythPriceKeys, "confirmed");

  const pythDataList = [];
  for (let i = 0; i < productsInfos.keys.length; i++) {
    const productData = parseProductData(productsInfos.array[i].data as Buffer);
    const priceKey = productData.priceAccountKey;
    const priceData = parsePriceData(priceInfos.array[i].data as Buffer);
    const symbol = tokenInfo[i].symbol;
    pythDataList.push({
      priceKey,
      symbol,
      productData,
      priceData,
    });
  }
  return pythDataList;
}
