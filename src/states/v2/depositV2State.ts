import { createReducer, createAction } from "@reduxjs/toolkit";
import { TokenConfig } from "constants/deployConfigV2";

const initialState = {
  method: "deposit",
  base: {
    token: null,
    amount: "0",
    amountWithSlippage: "0",
  },
  quote: {
    token: null,
    amount: "0",
    amountWithSlippage: "0",
  },
};

export const setTokenAmount = createAction<{
  baseAmount: string;
  quoteAmount: string;
}>("v2/deposit/setTokenAmount");

export const setTokenInfo = createAction<{
  baseTokenInfo: TokenConfig;
  quoteTokenInfo: TokenConfig;
}>("v2/deposit/setTokenInfo");

export const setMethod = createAction<{
  method: string;
}>("v2/deposit/setMethod");

export const depositV2Reducer = createReducer(initialState, (builder) => {
  builder.addCase(setTokenInfo, (state, action) => {
    state.base.token = action.payload.baseTokenInfo;
    state.quote.token = action.payload.quoteTokenInfo;
  });

  builder.addCase(setTokenAmount, (state, action) => {
    state.base.amount = action.payload.baseAmount;
    state.quote.amount = action.payload.quoteAmount;
  });

  builder.addCase(setMethod, (state, action) => {
    state.method = action.payload.method;
  });
});
