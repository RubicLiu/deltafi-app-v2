import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  referralLinkState: "Unavailable",
  referralLink: "",
  isRefreshing: false,
  isClaiming: false,
  openSnackbar: false,
  claimResult: null,
  rewardRefreshTs: Math.floor(Date.now() / 1000),
};

const rewardViewSlice = createSlice({
  name: "rewardView",
  initialState,
  reducers: {
    setReferralLinkState(state, action: PayloadAction<{ referralLinkState: string }>) {
      state.referralLinkState = action.payload.referralLinkState;
    },

    setReferralLink(state, action: PayloadAction<{ referralLink: string }>) {
      state.referralLink = action.payload.referralLink;
    },

    setIsRefreshing(state, action: PayloadAction<{ isRefreshing: boolean }>) {
      state.isRefreshing = action.payload.isRefreshing;
    },

    setIsClaiming(state, action: PayloadAction<{ isClaiming: boolean }>) {
      state.isClaiming = action.payload.isClaiming;
    },

    setClaimResult(state, action: PayloadAction<{ claimResult: { status: boolean } }>) {
      state.claimResult = action.payload.claimResult;
    },

    setOpenSnackbar(state, action: PayloadAction<{ openSnackbar: boolean }>) {
      state.openSnackbar = action.payload.openSnackbar;
    },

    updateRefreshTs(state) {
      state.rewardRefreshTs = Math.floor(Date.now() / 1000);
    },
  },
});

export const rewardViewReducer = rewardViewSlice.reducer;
export const rewardViewActions = rewardViewSlice.actions;
