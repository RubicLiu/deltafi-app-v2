import { combineReducers } from "@reduxjs/toolkit";
import { dashboardViewReducer } from "./dashboardView";
import { depositViewReducer } from "./depositView";
import { rewardViewReducer } from "./rewardView";
import { stakeViewReducer } from "./stakeView";
import { swapViewReducer } from "./swapView";

export const viewsReducer = combineReducers({
  depositView: depositViewReducer,
  swapView: swapViewReducer,
  rewardView: rewardViewReducer,
  stakeView: stakeViewReducer,
  dashboardView: dashboardViewReducer,
});
