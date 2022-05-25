import { configureStore } from "@reduxjs/toolkit";
import { serumReducer } from "./serumState";

import { viewsReducer } from "./views";
import { accountsReducer } from "./accounts";
import { appReducer } from "./appState";
import { gateIoReducer } from "./gateIoState";

export const store = configureStore({
  reducer: {
    serum: serumReducer,
    accounts: accountsReducer,
    views: viewsReducer,
    app: appReducer,
    gateIo: gateIoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We need to disable it, because PublicKey is not serializable.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
