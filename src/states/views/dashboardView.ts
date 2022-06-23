import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  selectedTab: "reward",
};

const dashboardViewSlice = createSlice({
  name: "dashboardView",
  initialState,
  reducers: {
    setSelectedTab(state, action: PayloadAction<{ selectedTab: string }>) {
      state.selectedTab = action.payload.selectedTab;
    },
  },
});

export const dashboardViewReducer = dashboardViewSlice.reducer;
export const dashboardViewActions = dashboardViewSlice.actions;
