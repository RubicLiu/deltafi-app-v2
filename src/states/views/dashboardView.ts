import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import BigNumber from "bignumber.js";

const initialState = {
  totalDelfiRewards: null,
  selectedTab: "reward",
};

const dashboardViewSlice = createSlice({
  name: "dashboardView",
  initialState,
  reducers: {
    setSelectedTab(state, action: PayloadAction<{ selectedTab: string }>) {
      state.selectedTab = action.payload.selectedTab;
    },

    setTotalDelfiRewards(state, action: PayloadAction<{ totalDelfiRewards: BigNumber }>) {
      state.totalDelfiRewards = action.payload.totalDelfiRewards;
    },
  },
});

export const dashboardViewReducer = dashboardViewSlice.reducer;
export const dashboardViewActions = dashboardViewSlice.actions;