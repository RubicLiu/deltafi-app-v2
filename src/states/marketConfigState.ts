import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";

import { deployConfig } from "constants/deployConfig";
import { parserConfigInfo } from "lib/state";
import { MarketConfig } from "providers/types";

export interface MarketConfigState {
  config: MarketConfig;
}

const initialState: MarketConfigState = {
  config: undefined,
};

export const fetchMarketConfigThunk = createAsyncThunk(
  "marketConfig/fetchMarketConfig",
  async (connection: Connection) => {
    const configAccountInfo = await connection.getAccountInfo(
      new PublicKey(deployConfig.marketConfigAddress),
    );
    const { data } = parserConfigInfo(configAccountInfo);
    const config = {
      verion: data.version,
      publicKey: deployConfig.marketConfigAddress,
      bumpSeed: data.bumpSeed,
      deltafiMint: data.deltafiMint,
      oracleProgramId: data.oracleProgramId,
      deltafiToken: data.deltafiToken,
    };
    console.info(config);
    return { config };
  },
);

export const marketConfigReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchMarketConfigThunk.fulfilled, (state, action) => {
    state.config = action.payload.config;
  });
});
