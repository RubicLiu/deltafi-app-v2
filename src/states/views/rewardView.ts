
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  referralLinkState: "Unavailable",
  referralLink: "",
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
  },
});

export const rewardViewReducer = rewardViewSlice.reducer;
export const rewardViewActions = rewardViewSlice.actions;
