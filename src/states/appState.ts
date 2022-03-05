import { createReducer, PayloadAction } from "@reduxjs/toolkit";
import { createAction } from "@reduxjs/toolkit";
import { PublicKey } from "@solana/web3.js";

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

export const SET_REFERRER = "APP.SET_REFERRER";
export const setReferrerAction =
  createAction<{ referrerPublicKey: PublicKey | null; enableReferral: boolean; timestamp: number }>(SET_REFERRER);

export const UPDATE_REFERRER = "APP.UPDATE_REFERRER";
export const updateReferrerAction =
  createAction<{ referrerPublicKey: PublicKey | null; isNewUser: boolean; timestamp: number }>(UPDATE_REFERRER);

export const appReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(
      setReferrerAction,
      (
        state,
        action: PayloadAction<{
          referrerPublicKey: PublicKey | null;
          enableReferral: boolean;
          timestamp: number;
        }>,
      ) => {
        state = {
          lastSetTime: action.payload.timestamp,
          ...action.payload,
        };
      },
    )
    .addCase(
      updateReferrerAction,
      (
        state,
        action: PayloadAction<{ referrerPublicKey: PublicKey | null; isNewUser: boolean; timestamp: number }>,
      ) => {
        if (action.payload.timestamp < state.lastSetTime || state.isNewUser !== undefined) {
          return;
        }
        state.referrerPublicKey = action.payload.referrerPublicKey;
        state.isNewUser = action.payload.isNewUser;
      },
    );
});
