import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appState";
import { farmUserReducer } from "./farmUserState";

export const store = configureStore({
  reducer: {
    app: appReducer,
    farmUser: farmUserReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
