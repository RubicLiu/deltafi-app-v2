import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appState";
import { farmUserReducer } from "./farmUserState";
import { farmPoolReducer } from "./farmPoolState";
import { poolReducer } from "./poolState";
import { pythReducer } from "./PythState";

export const store = configureStore({
  reducer: {
    app: appReducer,
    farmUser: farmUserReducer,
    farmPool: farmPoolReducer,
    pool: poolReducer,
    pyth: pythReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We need to disable it, because PublicKey is not serializable.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
