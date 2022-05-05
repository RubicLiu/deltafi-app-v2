import { combineReducers } from "redux";
import { depositV2Reducer } from "./depositV2State";
import { stakeV2Reducer } from "./stakeV2State";

export const viewsReducer = combineReducers({
  depositV2: depositV2Reducer,
  stakeV2: stakeV2Reducer,
});
