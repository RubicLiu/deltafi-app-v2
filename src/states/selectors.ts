import { RootState } from "./store";

// TODO(ypeng): Replace legacy app state with DeltafiUser state.
export const appSelector = (state: RootState) => state.app;
