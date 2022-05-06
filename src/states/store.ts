import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appState";
import { serumReducer } from "./serumState";

import { viewsReducer } from "./views";
import { accountsReducer } from "./accounts";

export const store = configureStore({
  reducer: {
    app: appReducer,
    serum: serumReducer,
    accounts: accountsReducer,
    views: viewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We need to disable it, because PublicKey is not serializable.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
