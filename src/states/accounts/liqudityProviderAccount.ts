import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { LiquidityProvider } from "anchor/type_definitions";

type SwapPoolKeyToLp = Record<string, LiquidityProvider>;

export interface LiquidityProviderState {
  swapKeyToLp: SwapPoolKeyToLp;
}

const initialState: LiquidityProviderState = {
  swapKeyToLp: {},
};

type FetchLiquidityProvidersThunkArg = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const fetchLiquidityProvidersThunk = createAsyncThunk(
  "v2/fetchLiquidityProviders",
  async (arg: FetchLiquidityProvidersThunkArg) => {
    if (!arg.connection || !arg.walletAddress) {
      return {
        swapKeyToLp: {},
      };
    }
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, arg.walletAddress),
    );

    const poolInfoList = deployConfigV2.poolInfoList;
    const lpAddressList = [];
    for (const poolInfo of poolInfoList) {
      const [lpPublicKey] = await PublicKey.findProgramAddress(
        [
          Buffer.from("LiquidityProvider"),
          new PublicKey(poolInfo.swapInfo).toBuffer(),
          arg.walletAddress.toBuffer(),
        ],
        program.programId,
      );
      lpAddressList.push(lpPublicKey);
    }

    const lpList = await program.account.liquidityProvider.fetchMultiple(lpAddressList);
    const swapKeyToLp = {};
    for (let i = 0; i < poolInfoList.length; ++i) {
      const poolInfo = poolInfoList[i];
      const lp = lpList[i];
      swapKeyToLp[poolInfo.swapInfo] = lp;
    }

    return {
      swapKeyToLp,
    };
  },
);

export const liquidityProviderAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchLiquidityProvidersThunk.fulfilled, (state, action) => {
    state.swapKeyToLp = action.payload.swapKeyToLp;
  });
});
