import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PublicKey } from "@solana/web3.js";

const initialState = {
  referrer: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReferrer(state, action: PayloadAction<PublicKey>) {
      state.referrer = action.payload;
    },
  },
});

export const appReducer = appSlice.reducer;
export const appActions = appSlice.actions;
