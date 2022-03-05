import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appState";
import { farmReducer } from "./farmState";

export const store = configureStore({
  reducer: {
    app: appReducer,
    farm: farmReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
