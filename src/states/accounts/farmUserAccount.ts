import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { FarmUser } from "anchor/type_definitions";

type FarmPoolKeyToFarmUser = Record<string, FarmUser>;
export interface FarmUserState {
  farmPoolKeyToFarmUser: FarmPoolKeyToFarmUser;
}

const initialState: FarmUserState = {
  farmPoolKeyToFarmUser: {},
};

type FetchFarmUsersThunkArg = {
  connection: Connection;
  walletAddress: PublicKey;
};

// TODO: need to test after farm transactions are added
export const fetchFarmUsersThunk = createAsyncThunk(
  "farmUser/fetchFarmUsers",
  async (arg: FetchFarmUsersThunkArg) => {
    if (!arg.connection || !arg.walletAddress) {
      return { farmPoolKeyToFarmUser: {} };
    }

    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, {}),
    );

    const poolInfoList = deployConfigV2.poolInfoList;
    const farmAddressList = poolInfoList
      .map(({ farmInfoList }) => farmInfoList.map(({ farmInfo }) => new PublicKey(farmInfo)))
      .flat();

    const farmPoolKeyToFarmUser = {};
    const farmUserAddressList = [];

    for (let i = 0; i < farmAddressList.length; i++) {
      const farmInfo = farmAddressList[i];
      const [farmUserPubKey] = await PublicKey.findProgramAddress(
        [Buffer.from("FarmUser"), farmInfo.toBuffer(), arg.walletAddress.toBuffer()],
        program.programId,
      );
      farmUserAddressList.push(farmUserPubKey);
    }

    const farmUserList = await program.account.farmUser.fetchMultiple(farmUserAddressList);

    for (let i = 0; i < farmAddressList.length; i++) {
      const farmInfoAddress = farmAddressList[i];
      const farmUser = farmUserList[i];
      farmPoolKeyToFarmUser[farmInfoAddress] = farmUser;
    }

    return {
      farmPoolKeyToFarmUser,
    };
  },
);

export const farmUserAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchFarmUsersThunk.fulfilled, (state, action) => {
    state.farmPoolKeyToFarmUser = action.payload.farmPoolKeyToFarmUser;
  });
});
