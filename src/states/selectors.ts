import { RootState } from "./store";

export const appSelector = (state: RootState) => state.app;
export const farmSelector = (state: RootState) => state.farm;
