import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { PublicKey, Connection } from "@solana/web3.js";

import { PoolInfo } from "providers/types";
import { getPoolFromSwapInfoAccount } from "providers/pool";
import { deployConfig } from "constants/deployConfig";
import { getMultipleAccounts } from "utils/account";
import { pools as poolSchemas } from "constants/pools";

type PoolKeyToPoolInfo = Record<string, PoolInfo>;

export interface PoolState {
  poolKeyToPoolInfo: PoolKeyToPoolInfo;
}

const initialState: PoolState = {
  poolKeyToPoolInfo: {},
};

type FetchPoolsThunkArg = {
  connection: Connection;
};

export const fetchPoolsThunk = createAsyncThunk(
  "pool/fetchPools",
  async (arg: FetchPoolsThunkArg) => {
    const poolKeyToPoolInfo: PoolKeyToPoolInfo = {};
    const pools = await getPools(arg.connection);
    for (const pool of pools) {
      poolKeyToPoolInfo[pool.publicKey.toBase58()] = pool;
    }
    return {
      poolKeyToPoolInfo,
    };
  },
);

export const poolReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchPoolsThunk.fulfilled, (state, action) => {
    state.poolKeyToPoolInfo = action.payload.poolKeyToPoolInfo;
  });
});

async function getPools(connection: Connection) {
  const poolConfigList = deployConfig.poolInfo;
  const poolAddressList = poolConfigList.map(({ swap }) => new PublicKey(swap));
  const poolInfos = await getMultipleAccounts(connection, poolAddressList, "confirmed");

  const pools = [];
  for (let i = 0; i < poolInfos.keys.length; i++) {
    const key = poolInfos.keys[i];
    const poolInfo = poolInfos.array[i];
    const publicKey = new PublicKey(key);
    const poolSchema = poolSchemas.find((s) => s.address.equals(publicKey));
    pools.push(getPoolFromSwapInfoAccount(poolSchema, publicKey, poolInfo));
  }
  return pools;
}
