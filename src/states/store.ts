import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appState";
import { farmUserReducer } from "./farmUserState";
import { farmPoolReducer } from "./farmPoolState";
import { poolReducer } from "./poolState";
import { pythReducer } from "./pythState";
import { serumReducer } from "./serumState";
import { tokenAccountReducer } from "./tokenAccountState";

import { swapV2Reducer } from "./swapV2State";

export const store = configureStore({
  reducer: {
    app: appReducer,
    farmUser: farmUserReducer,
    farmPool: farmPoolReducer,
    pool: poolReducer,
    pyth: pythReducer,
    tokenAccount: tokenAccountReducer,
    serum: serumReducer,
    swapV2: swapV2Reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We need to disable it, because PublicKey is not serializable.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
