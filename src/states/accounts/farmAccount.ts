import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";

const initialState = {
  farmKeyToFarmInfo: {},
};

type FetchFarmsThunkArg = {
  connection: Connection;
};

export const fetchFarmsThunk = createAsyncThunk(
  "v2/fetchFarms",
  async (arg: FetchFarmsThunkArg) => {
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, {}),
    );

    const poolInfoList = deployConfigV2.poolInfoList;
    const farmAddressList = poolInfoList
      ?.map(({ farmInfoList }) => farmInfoList?.map(({ farmInfo }) => new PublicKey(farmInfo)))
      .flat();

    const farmInfoList = await program.account.farmInfo.fetchMultiple(farmAddressList);
    const farmKeyToFarmInfo = {};

    let i = 0;
    poolInfoList?.forEach((poolInfo) => {
      poolInfo.farmInfoList?.foreach((farm) => {
        const farmInfo = farmInfoList[i];
        farmKeyToFarmInfo[farm.farmInfo] = farmInfo;
        i++;
      });
    });

    return {
      farmKeyToFarmInfo,
    };
  },
);

export const farmAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchFarmsThunk.fulfilled, (state, action) => {
    state.farmKeyToFarmInfo = action.payload.farmKeyToFarmInfo;
  });
});
