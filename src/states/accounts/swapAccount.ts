import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";

const initialState = {
  swapKeyToSwapInfo: {},
};

type FetchSwapsThunkArg = {
  connection: Connection;
};

export const fetchSwapsThunk = createAsyncThunk(
  "v2/fetchSwaps",
  async (arg: FetchSwapsThunkArg) => {
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, {}),
    );

    const poolInfoList = deployConfigV2.poolInfoList;
    const swapAddressList = deployConfigV2.poolInfoList.map(
      ({ swapInfo }) => new PublicKey(swapInfo),
    );
    const swapInfoList = await program.account.swapInfo.fetchMultiple(swapAddressList);
    const swapKeyToSwapInfo = {};
    for (let i = 0; i < poolInfoList.length; ++i) {
      const poolInfo = poolInfoList[i];
      const swapInfo = swapInfoList[i];
      swapKeyToSwapInfo[poolInfo.swapInfo] = swapInfo;
    }

    return {
      swapKeyToSwapInfo,
    };
  },
);

export const swapAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchSwapsThunk.fulfilled, (state, action) => {
    state.swapKeyToSwapInfo = action.payload.swapKeyToSwapInfo;
  });
});
