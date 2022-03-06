import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { createAction } from "@reduxjs/toolkit";
import { PublicKey, Connection } from "@solana/web3.js";
import { SWAP_PROGRAM_ID } from "constants/index";
import { UserReferrerDataLayout } from "lib/state";

export interface AppState {
  referrerPublicKey?: PublicKey | null;
  enableReferral: boolean;
  lastSetTime: number;
  isNewUser?: boolean;
}

const initialState: AppState = {
  referrerPublicKey: undefined,
  enableReferral: false,
  // this flag is for checking if the async process matches the current state
  lastSetTime: 0,
  // if isNewUser is undefined, it means the state if not validated and not ready for use
  isNewUser: undefined,
};

export const setReferrerAction =
  createAction<{ referrerPublicKey: PublicKey | null; enableReferral: boolean }>("app/setReferrer");

type FetchReferrerThunkArg = {
  connection: Connection;
  config: PublicKey;
  walletAddress: PublicKey;
};

export const fetchReferrerThunk = createAsyncThunk("app/fetchReferrer", async (arg: FetchReferrerThunkArg) => {
  const timestamp = Date.now();
  const referralAccountPublickey = await PublicKey.createWithSeed(arg.walletAddress, "referrer", SWAP_PROGRAM_ID);
  const referralAccountInfo = await arg.connection.getAccountInfo(referralAccountPublickey);

  let referrerPublicKey: PublicKey = null;
  let isNewUser: boolean = null;
  if (referralAccountInfo) {
    const referralInfo = UserReferrerDataLayout.decode(referralAccountInfo.data);
    if (arg.walletAddress !== referralInfo.referrer) {
      referrerPublicKey = referralInfo.referrer;
    }
    // TODO: check if the referrer is a dummy key, set it to null
    isNewUser = false;
  }

  return {
    referrerPublicKey,
    isNewUser,
    timestamp,
  };
});

export const appReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setReferrerAction, (state, action) => {
      state.enableReferral = action.payload.enableReferral;
      state.referrerPublicKey = action.payload.referrerPublicKey;
      state.lastSetTime = undefined;
      state.isNewUser = undefined;
    })
    .addCase(fetchReferrerThunk.fulfilled, (state, action) => {
      if (action.payload.timestamp < state.lastSetTime || state.isNewUser !== undefined) {
        return;
      }
      state.referrerPublicKey = action.payload.referrerPublicKey;
      state.isNewUser = action.payload.isNewUser;
    });
});
