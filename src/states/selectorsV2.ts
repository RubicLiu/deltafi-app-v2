import { RootState } from "./store";

import { getPythMarketPrice } from "./accounts/pythAccount";
import { getPoolConfigBySymbols, PoolConfig } from "constants/deployConfigV2";

export const lpUserSelector = (state: RootState) => state.accounts.liquidityProviderAccount;
export const farmPoolSelector = (state: RootState) => state.accounts.farmAccount;
export const poolSelector = (state: RootState) => state.accounts.swapAccount;
export const pythSelector = (state: RootState) => state.accounts.pythAccount;
export const tokenAccountSelector = (state: RootState) => state.accounts.tokenAccount;
export const deltafiUserSelector = (state: RootState) => state.accounts.deltafiUserAccount;

export const depositViewSelector = (state: RootState) => state.views.depositView;
export const stakeViewSelector = (state: RootState) => state.views.stakeView;
export const swapViewSelector = (state: RootState) => state.views.swapView;

export function selectMarketPriceByPool(poolConfig: PoolConfig) {
  return (state: RootState) => {
    return getPythMarketPrice(state.accounts.pythAccount.symbolToPythData, poolConfig);
  };
}

export function selectPoolBySymbols(baseSymbol: string, quoteSymbol: string) {
  return (state: RootState) => {
    const poolConfig = getPoolConfigBySymbols(baseSymbol, quoteSymbol);
    return state.accounts.swapAccount.swapKeyToSwapInfo[poolConfig?.swapInfo];
  };
}

export function selectTokenAccountInfoByMint(mint: string) {
  return (state: RootState) => {
    if (state.accounts.tokenAccount.mintToTokenAccountInfo == null) {
      return null;
    }
    return state.accounts.tokenAccount.mintToTokenAccountInfo[mint];
  };
}

export function selectSwapBySwapKey(poolKey: string) {
  return (state: RootState) => {
    return state.accounts.swapAccount.swapKeyToSwapInfo[poolKey];
  };
}

export function selectLpUserBySwapKey(swapKey: string) {
  return (state: RootState) => {
    return state.accounts.liquidityProviderAccount.swapKeyToLp[swapKey];
  };
}

export function selectFarmByFarmKey(farmKey: string) {
  return (state: RootState) => {
    return state.accounts.farmAccount.farmKeyToFarmInfo[farmKey];
  };
}