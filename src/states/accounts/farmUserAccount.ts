import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";

export const x = 1;

const initialState = {
  swapkeyToFarmUser: {},
};

type FetchFarmUserThunkArg = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const fetchFarmUserThunk = createAsyncThunk(
  "v2/fetchFarmUser",
  async (arg: FetchFarmUserThunkArg) => {
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, arg.walletAddress),
    );

    const poolInfoList = deployConfigV2.poolInfoList;
    const farmUserAddressList = [];
    for (const poolInfo of poolInfoList) {
      const [farmUserAddressList] = await PublicKey.findProgramAddress(
        [
          Buffer.from("LiquidityProvider"),
          new PublicKey(poolInfo.swapInfo).toBuffer(),
          arg.walletAddress.toBuffer(),
        ],
        program.programId,
      );
      lpAddressList.push(lpPublicKey);
    }

    const lpList = await program.account.farmUser.fetchMultiple(farmUserAddressList);
    const swapKeyToLp = {};
    for (let i = 0; i < poolInfoList.length; ++i) {
      const poolInfo = poolInfoList[i];
      const lp = lpList[i];
      swapKeyToLp[poolInfo.swapInfo] = lp;
    }

    return {
      swapkeyToFarmUser,
    };
  },
);

export const liquidityProviderAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchFarmUserThunk.fulfilled, (state, action) => {
    state.swapkeyToFarmUser = action.payload.swapkeyToFarmUser;
  });
});
