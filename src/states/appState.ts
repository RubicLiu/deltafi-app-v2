import { Program } from "@project-serum/anchor";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { DeltafiDexV2 } from "anchor/types/deltafi_dex_v2";

const initialState = {
  referrer: null,
  connection: null,
  wallet: null,
  program: null,
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

    setProgram(state, action: PayloadAction<Program<DeltafiDexV2>>) {
      state.program = action.payload;
    },
  },
});

export const appReducer = appSlice.reducer;
export const appActions = appSlice.actions;
