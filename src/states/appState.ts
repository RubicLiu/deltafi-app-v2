import { createReducer, PayloadAction } from "@reduxjs/toolkit";
import { createAction } from "@reduxjs/toolkit";

export interface AppState {
  referrer?: string;
  enableReferral?: boolean;
}

const initialState: AppState = {
  referrer: undefined,
  enableReferral: false,
};

export const SET_REFERRER = "APP.SET_REFERRER";
export const setReferrerAction = createAction<{
  referrer: string;
  enableReferral: boolean;
}>(SET_REFERRER);

export const appReducer = createReducer(initialState, (builder) => {
  builder.addCase(
    setReferrerAction,
    (
      state,
      action: PayloadAction<{
        referrer: string;
        enableReferral: boolean;
      }>,
    ) => {
      state.referrer = action.payload.referrer;
      state.enableReferral = action.payload.enableReferral;
    },
  );
});
