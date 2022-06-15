import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import BigNumber from "bignumber.js";

type FarmPoolToRewards = Record<
  string,
  {
    unclaimedFarmRewards: string;
    totalFarmRewards: string;
  }
>;

const initialState = {
  referralLinkState: "Unavailable",
  referralLink: "",
  isRefreshing: false,
  isClaimingFarmRewards: false,
  isClaimingTradeRewards: false,
  isClaimingReferralRewards: false,
  openSnackbar: false,
  claimResult: null,
  farmPoolToRewards: {},
  rewardRefreshTs: Math.floor(Date.now() / 1000),
  totalDelfiRewards: new BigNumber(0),
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

    setIsClaimingFarmRewards(state, action: PayloadAction<{ isClaimingFarmRewards: boolean }>) {
      state.isClaimingFarmRewards = action.payload.isClaimingFarmRewards;
    },

    setisClaimingTradeRewards(state, action: PayloadAction<{ isClaimingTradeRewards: boolean }>) {
      state.isClaimingTradeRewards = action.payload.isClaimingTradeRewards;
    },

    setIsClaimingReferralRewards(
      state,
      action: PayloadAction<{ isClaimingReferralRewards: boolean }>,
    ) {
      state.isClaimingReferralRewards = action.payload.isClaimingReferralRewards;
    },

    setClaimResult(state, action: PayloadAction<{ claimResult: { status: boolean } }>) {
      state.claimResult = action.payload.claimResult;
    },

    setOpenSnackbar(state, action: PayloadAction<{ openSnackbar: boolean }>) {
      state.openSnackbar = action.payload.openSnackbar;
    },

    setFarmPoolRewardsInfo(state, action: PayloadAction<{ farmPoolToRewards: FarmPoolToRewards }>) {
      state.farmPoolToRewards = action.payload.farmPoolToRewards;
    },

    updateRefreshTs(state) {
      state.rewardRefreshTs = Math.floor(Date.now() / 1000);
    },
  },
});

export const rewardViewReducer = rewardViewSlice.reducer;
export const rewardViewActions = rewardViewSlice.actions;
