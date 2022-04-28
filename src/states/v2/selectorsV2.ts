import { RootState } from "../store";

import { getPythMarketPrice } from "./pythV2State";
import { getPoolConfigBySymbols } from "constants/deployConfigV2";

export const farmPoolSelector = (state: RootState) => state.farmV2;
export const poolSelector = (state: RootState) => state.swapV2;
export const pythSelector = (state: RootState) => state.pythV2;
export const tokenAccountSelector = (state: RootState) => state.tokenV2;

export function selectMarketPriceByPool(pool) {
  return (state: RootState) => {
    return getPythMarketPrice(state.pythV2.symbolToPythData, pool);
  };
}

export function selectPoolBySymbols(baseSymbol: string, quoteSymbol: string) {
  return (state: RootState) => {
    const poolConfig = getPoolConfigBySymbols(baseSymbol, quoteSymbol);
    return state.swapV2.swapKeyToSwapInfo[poolConfig?.swapInfo];
  };
}

export function selectTokenAccountInfoByMint(mint: string) {
  return (state: RootState) => {
    if (state.tokenV2.mintToTokenAccountInfo == null) {
      return null;
    }
    return state.tokenV2.mintToTokenAccountInfo[mint];
  };
}
