import { combineReducers } from "@reduxjs/toolkit";
import { deltafiUserAccountReducer } from "./deltafiUserAccount";
import { farmAccountReducer } from "./farmAccount";
import { farmUserAccountReducer } from "./farmUserAccount";
import { liquidityProviderAccountReducer } from "./liqudityProviderAccount";
import { pythAccountReducer } from "./pythAccount";
import { swapAccountReducer } from "./swapAccount";
import { tokenAccountReducer } from "./tokenAccount";

export const accountsReducer = combineReducers({
  swapAccount: swapAccountReducer,
  farmAccount: farmAccountReducer,
  liquidityProviderAccount: liquidityProviderAccountReducer,
  farmUserAccount: farmUserAccountReducer,
  deltafiUserAccount: deltafiUserAccountReducer,
  pythAccount: pythAccountReducer,
  tokenAccount: tokenAccountReducer,
});
