import { RootState } from "./store";

export const appSelector = (state: RootState) => state.app;
export const farmUserSelector = (state: RootState) => state.farmUser;
export const farmPoolSelector = (state: RootState) => state.farmPool;
export const poolSelector = (state: RootState) => state.pool;
export const pythSelector = (state: RootState) => state.pyth;
export const serumSelector = (state: RootState) => state.serum;
export const tokenAccountSelector = (state: RootState) => state.tokenAccount;

export function selectTokenAccountInfoByMint(mint: string) {
  return (state: RootState) => {
    if (state.tokenAccount.mintToTokenAccountInfo == null) {
      return null;
    }
    return state.tokenAccount.mintToTokenAccountInfo[mint];
  };
}
