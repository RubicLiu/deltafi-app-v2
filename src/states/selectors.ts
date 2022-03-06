import { RootState } from "./store";

export const appSelector = (state: RootState) => state.app;
export const farmUserSelector = (state: RootState) => state.farmUser;
