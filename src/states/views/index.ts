import { combineReducers } from "@reduxjs/toolkit";
import { depositViewReducer } from "./depositView";
import { rewardViewReducer } from "./rewardView";
import { swapViewReducer } from "./swapView";

export const viewsReducer = combineReducers({
  depositView: depositViewReducer,
  swapView: swapViewReducer,
  rewardView: rewardViewReducer,
});
