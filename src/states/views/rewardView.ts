import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  referralLinkState: "Unavailable",
  referralLink: "",
  isRefreshing: false,
  isClaiming: false,
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
  },
});

export const rewardViewReducer = rewardViewSlice.reducer;
export const rewardViewActions = rewardViewSlice.actions;
