import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { AccountInfo, PublicKey, Connection } from "@solana/web3.js";
import BigNumber from "bignumber.js";

import { SWAP_PROGRAM_ID } from "constants/index";
import { getFilteredProgramAccounts } from "utils/account";
import { FarmUserFlat, FarmUserLayout } from "lib/state/farm";
import { getStakeFilters } from "providers/farm";
import { StakeAccount } from "providers/types";

type FarmPoolKeyToFarmUser = Record<string, FarmUserFlat>;

export interface FarmState {
  farmPoolKeyToFarmUser: FarmPoolKeyToFarmUser;
}

const initialState: FarmState = {
  farmPoolKeyToFarmUser: {},
};

type FetchFarmUsersThunkArg = {
  connection: Connection;
  config: PublicKey;
  walletAddress: PublicKey;
};

export const fetchFarmUsersThunk = createAsyncThunk("farm/fetchFarmUsers", async (arg: FetchFarmUsersThunkArg) => {
  const farmUsers = await getFarmUsers(arg.connection, arg.config, arg.walletAddress);
  const farmPoolKeyToFarmUser: FarmPoolKeyToFarmUser = {};
  console.info("found farm users " + farmUsers.length);
  for (const farmUser of farmUsers) {
    farmPoolKeyToFarmUser[farmUser.farmPoolKey.toBase58()] = farmUser;
    console.info(farmUser);
  }
  return {
    farmPoolKeyToFarmUser,
  };
});

export const farmReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchFarmUsersThunk.fulfilled, (state, action) => {
    state.farmPoolKeyToFarmUser = action.payload.farmPoolKeyToFarmUser;
  });
});

const parseFarmUser = (publicKey: PublicKey, info: AccountInfo<Buffer>) => {
  const buffer = Buffer.from(info.data);
  const farmUser = FarmUserLayout.decode(buffer);
  if (!farmUser.isInitialized) {
    return;
  }
  return {
    publicKey,
    ...farmUser,
  };
};

export async function getFarmUsers(connection: Connection, config: PublicKey, walletAddress: PublicKey) {
  const stakeFilters = getStakeFilters(config, walletAddress);
  const farmUserAccountInfos = await getFilteredProgramAccounts(connection, SWAP_PROGRAM_ID, stakeFilters);
  return farmUserAccountInfos
    .map(({ publicKey, accountInfo }) => ({ publicKey, farmUserInfo: parseFarmUser(publicKey, accountInfo) }))
    .filter(({ farmUserInfo }) => !!farmUserInfo)
    .map(({ farmUserInfo }) => farmUserInfo);
}

export function toFarmUserPosition(farmUser: FarmUserFlat) {
  if (farmUser == null) {
    return null;
  }

  const farmUserAddress = farmUser.publicKey;
  const positions: {
    [key: string]: StakeAccount;
  } = {};

  const poolId = farmUser.farmPoolKey.toBase58();
  const depositBalance = new BigNumber(farmUser.depositedAmount.toString());
  positions[poolId] = {
    depositBalance,
    rewardsOwed: new BigNumber(farmUser.rewardsOwed.toString()),
    rewardEstimated: new BigNumber(farmUser.rewardsEstimated.toString()),
    lastUpdateTs: new BigNumber(farmUser.lastUpdateTs.toString()),
    nextClaimTs: new BigNumber(farmUser.nextClaimTs.toString()),
  };

  return { publicKey: farmUserAddress, positions };
}
