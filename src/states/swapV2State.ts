import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { getDeltafiDexV2, deployConfigV2 } from "anchor/utils";

const initialState = {
  swapKeyToSwapInfo: {},
};

type FetchSwapsV2ThunkArg = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const fetchSwapsV2Thunk = createAsyncThunk(
  "pool/fetchSwaps",
  async (arg: FetchSwapsV2ThunkArg) => {
    const program = getDeltafiDexV2(
      arg.connection,
      arg.walletAddress,
      new PublicKey(deployConfigV2.programId),
    );

    const swapKeyToSwapInfo = {};
    for (const poolInfo of deployConfigV2.poolInfoList) {
      const swapKey = new PublicKey(poolInfo.swapInfo);
      const swapInfo = await program.account.swapInfo.fetch(swapKey);
      console.info(swapInfo);
      swapKeyToSwapInfo[poolInfo.swapInfo] = swapInfo;
    }

    return {
      swapKeyToSwapInfo,
    };
  },
);

export const swapV2Reducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchSwapsV2Thunk.fulfilled, (state, action) => {
    state.swapKeyToSwapInfo = action.payload.swapKeyToSwapInfo;
  });
});
