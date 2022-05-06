import { configureStore } from "@reduxjs/toolkit";
import { serumReducer } from "./serumState";

import { viewsReducer } from "./views";
import { accountsReducer } from "./accounts";
import { appReducer } from "./appState";

export const store = configureStore({
  reducer: {
    serum: serumReducer,
    accounts: accountsReducer,
    views: viewsReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We need to disable it, because PublicKey is not serializable.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
