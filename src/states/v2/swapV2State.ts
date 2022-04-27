import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";

const initialState = {
  swapKeyToSwapInfo: {},
};

type FetchSwapsV2ThunkArg = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const fetchSwapsV2Thunk = createAsyncThunk(
  "v2/fetchSwaps",
  async (arg: FetchSwapsV2ThunkArg) => {
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, arg.walletAddress),
    );

    const swapKeyToSwapInfo = {};
    for (const poolInfo of deployConfigV2.poolInfoList) {
      const swapKey = new PublicKey(poolInfo.swapInfo);
      const swapInfo = await program.account.swapInfo.fetch(swapKey);
      console.info("swap", poolInfo.name, swapInfo);
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
