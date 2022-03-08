import { RootState } from "./store";

export const appSelector = (state: RootState) => state.app;
export const farmUserSelector = (state: RootState) => state.farmUser;
export const farmPoolSelector = (state: RootState) => state.farmPool;
export const poolSelector = (state: RootState) => state.pool;
export const pythSelector = (state: RootState) => state.pyth;
