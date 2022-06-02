import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { FarmInfo } from "anchor/type_definitions";

type FarmPoolKeyToFarm = Record<string, FarmInfo>;

export interface FarmState {
  farmKeyToFarmInfo: FarmPoolKeyToFarm;
}

const initialState: FarmState = {
  farmKeyToFarmInfo: {},
};

type FetchFarmsThunkArg = {
  connection: Connection;
};

// TODO: need to test after farm transactions are added
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

    for (let i = 0; i < farmAddressList.length; i++) {
      const farmInfo = farmInfoList[i];
      const farmInfoAddress = farmAddressList[i];
      farmKeyToFarmInfo[farmInfoAddress] = farmInfo;
    }

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
