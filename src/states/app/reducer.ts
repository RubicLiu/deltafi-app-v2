import { createReducer, PayloadAction } from "@reduxjs/toolkit";
import * as appActions from "./actions";
export interface AppState {
  referrer?: string;
}

const initialState: AppState = { referrer: undefined };

export const appReducer = createReducer(initialState, (builder) => {
  builder.addCase(appActions.setReferrer, (state, action: PayloadAction<{ referrer: string }>) => {
    state.referrer = action.payload.referrer;
  });
});
