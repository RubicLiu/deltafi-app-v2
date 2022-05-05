import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appState";
import { serumReducer } from "./serumState";

import { swapV2Reducer } from "./v2/swapV2State";
import { farmV2Reducer } from "./v2/farmV2State";
import { liquidityProviderV2Reducer } from "./v2/liqudityProviderV2State";
import { userV2Reducer } from "./v2/userV2State";
import { pythV2Reducer } from "./v2/pythV2State";
import { tokenV2Reducer } from "./v2/tokenV2State";
import { viewsReducer } from "./views";

export const store = configureStore({
  reducer: {
    app: appReducer,
    serum: serumReducer,
    swapV2: swapV2Reducer,
    farmV2: farmV2Reducer,
    liquidityProviderV2: liquidityProviderV2Reducer,
    userV2: userV2Reducer,
    pythV2: pythV2Reducer,
    tokenV2: tokenV2Reducer,
    views: viewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We need to disable it, because PublicKey is not serializable.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
