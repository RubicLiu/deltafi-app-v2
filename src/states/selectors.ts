import { RootState } from "./store";

import { getPythMarketPrice, getPythPrice } from "./accounts/pythAccount";
import { getPoolConfigBySymbols, PoolConfig, poolConfigs } from "constants/deployConfigV2";
import { getPythMarketPriceTuple } from "anchor/pyth_utils";

export const appSelector = (state: RootState) => state.app;
export const lpUserSelector = (state: RootState) => state.accounts.liquidityProviderAccount;
export const poolSelector = (state: RootState) => state.accounts.swapAccount;
export const pythSelector = (state: RootState) => state.accounts.pythAccount;
export const tokenAccountSelector = (state: RootState) => state.accounts.tokenAccount;
export const deltafiUserSelector = (state: RootState) => state.accounts.deltafiUserAccount;
export const farmUserSelector = (state: RootState) =>
  state.accounts.farmUserAccount.farmPoolKeyToFarmUser;
export const farmSelector = (state: RootState) => state.accounts.farmAccount.farmKeyToFarmInfo;

export const depositViewSelector = (state: RootState) => state.views.depositView;
export const swapViewSelector = (state: RootState) => state.views.swapView;
export const rewardViewSelector = (state: RootState) => state.views.rewardView;
export const stakeViewSelector = (state: RootState) => state.views.stakeView;

export const gateIoSelector = (state: RootState) => state.gateIo;
export const programSelector = (state: RootState) => state.app.program;

export function selectPythPrice(symbol: string) {
  return (state: RootState) => {
    return getPythPrice(state.accounts.pythAccount.symbolToPythPriceData, symbol);
  };
}

export function selectMarketPriceTuple(poolConfig: PoolConfig) {
  return (state: RootState) => {
    return getPythMarketPriceTuple(
      state.accounts.pythAccount.symbolToPythPriceData,
      poolConfig.base,
      poolConfig.quote,
    );
  };
}

export function selectMarketPriceByPool(poolConfig: PoolConfig) {
  return (state: RootState) => {
    const symbolToPythPriceData = state.accounts.pythAccount.symbolToPythPriceData;
    const marketPriceTuple = getPythMarketPriceTuple(
      symbolToPythPriceData,
      poolConfig.base,
      poolConfig.quote,
    );

    const basePrice = getPythPrice(symbolToPythPriceData, poolConfig.base);
    const quotePrice = getPythPrice(symbolToPythPriceData, poolConfig.quote);

    return {
      marketPrice: marketPriceTuple?.marketPrice,
      basePrice: basePrice.price,
      quotePrice: quotePrice.price,
      marketPriceLow: marketPriceTuple?.lowPrice,
      marketPriceHigh: marketPriceTuple?.highPrice,
    };
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

export function selectFarmByFarmKey(farmKey: string) {
  return (state: RootState) => {
    return state.accounts.farmAccount.farmKeyToFarmInfo[farmKey];
  };
}

export function selectFarmUserByFarmKey(farmKey: string) {
  return (state: RootState) => {
    return state.accounts.farmUserAccount.farmPoolKeyToFarmUser[farmKey];
  };
}

export function selectLpUserBySwapKey(swapKey: string) {
  return (state: RootState) => {
    return state.accounts.liquidityProviderAccount.swapKeyToLp[swapKey];
  };
}

export function selectGateIoSticker(currencyPair: string) {
  return (state: RootState) => {
    return state.gateIo.currencyPairToTicker[currencyPair];
  };
}
