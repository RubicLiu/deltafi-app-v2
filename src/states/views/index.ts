import { combineReducers } from "@reduxjs/toolkit";
import { depositViewReducer } from "./depositView";
import { rewardViewReducer } from "./rewardView";
import { stakeViewReducer } from "./stakeView";
import { swapViewReducer } from "./swapView";

export const viewsReducer = combineReducers({
  depositView: depositViewReducer,
  stakeView: stakeViewReducer,
  swapView: swapViewReducer,
  rewardView: rewardViewReducer,
});
