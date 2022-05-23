import { combineReducers } from "@reduxjs/toolkit";
import { deltafiUserAccountReducer } from "./deltafiUserAccount";
import { liquidityProviderAccountReducer } from "./liqudityProviderAccount";
import { pythAccountReducer } from "./pythAccount";
import { swapAccountReducer } from "./swapAccount";
import { tokenAccountReducer } from "./tokenAccount";

export const accountsReducer = combineReducers({
  swapAccount: swapAccountReducer,
  liquidityProviderAccount: liquidityProviderAccountReducer,
  deltafiUserAccount: deltafiUserAccountReducer,
  pythAccount: pythAccountReducer,
  tokenAccount: tokenAccountReducer,
});
