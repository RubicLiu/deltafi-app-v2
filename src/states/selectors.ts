import { getMarketPrice } from "./PythState";
import { RootState } from "./store";

import { PoolInfo } from "providers/types";

export const appSelector = (state: RootState) => state.app;
export const farmUserSelector = (state: RootState) => state.farmUser;
export const farmPoolSelector = (state: RootState) => state.farmPool;
export const poolSelector = (state: RootState) => state.pool;
export const pythSelector = (state: RootState) => state.pyth;

export function selectFarmUserByFarmPoolKey(farmPoolKey: string) {
  return (state: RootState) => {
    return state.farmUser.farmPoolKeyToFarmUser[farmPoolKey];
  };
}

export function selectFarmPoolByFarmPoolKey(farmPoolKey: string) {
  return (state: RootState) => {
    return state.farmPool.farmPoolKeyToFarmPoolInfo[farmPoolKey];
  };
}

export function selectPythMarketPriceByPool(pool: PoolInfo) {
  return (state: RootState) => {
    return getMarketPrice(state.pyth.symbolToPythData, pool);
  };
}
