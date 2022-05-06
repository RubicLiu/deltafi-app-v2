import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

const initialState = {
  referrer: null,
  connection: null,
  wallet: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReferrer(state, action: PayloadAction<PublicKey>) {
      state.referrer = action.payload;
    },

    setConnection(state, action: PayloadAction<Connection>) {
      state.connection = action.payload;
    },

    setWallet(state, action: PayloadAction<WalletContextState>) {
      state.wallet = action.payload;
    },
  },
});

export const appReducer = appSlice.reducer;
export const appActions = appSlice.actions;
