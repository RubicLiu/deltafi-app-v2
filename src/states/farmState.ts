import { createReducer, PayloadAction } from "@reduxjs/toolkit";
import { createAction } from "@reduxjs/toolkit";
import { PublicKey, Connection } from "@solana/web3.js";

import { SWAP_PROGRAM_ID } from "constants/index";
import { getFilteredProgramAccounts } from "utils/account";
import { FarmUserFlat, parseFarmUser } from "lib/state/farm";
import { getStakeFilters } from "providers/farm";

export interface FarmState {
  farmPoolKeyToFarmUser: { [key: string]: FarmUserFlat };
}

const initialState: FarmState = {
  farmPoolKeyToFarmUser: {},
};

export const FETCH_FARM_USERS = "FARM.FETCH_FARM_USERS";
export const fetchFarmUsersAction = createAction<{
  farmPoolKeyToFarmUser: { [key: string]: FarmUserFlat };
}>(FETCH_FARM_USERS);

export const farmReducer = createReducer(initialState, (builder) => {
  builder.addCase(
    fetchFarmUsersAction,
    (
      state,
      action: PayloadAction<{
        farmPoolKeyToFarmUser: { [key: string]: FarmUserFlat };
      }>,
    ) => {
      state.farmPoolKeyToFarmUser = action.payload.farmPoolKeyToFarmUser;
    },
  );
});

export async function getFarmUsers(connection: Connection, config: PublicKey, walletAddress: PublicKey) {
  const stakeFilters = getStakeFilters(config, walletAddress);

  const farmUserAccountInfos = await getFilteredProgramAccounts(connection, SWAP_PROGRAM_ID, stakeFilters);
  const filtered = farmUserAccountInfos
    .map(({ publicKey, accountInfo }) => ({ publicKey, farmUserInfo: parseFarmUser(accountInfo) }))
    .filter(({ farmUserInfo }) => !!farmUserInfo);

  return filtered.map(({ farmUserInfo }) => ({
    configKey: farmUserInfo.data.configKey,
    farmPoolKey: farmUserInfo.data.farmPoolKey,
  }));
}
