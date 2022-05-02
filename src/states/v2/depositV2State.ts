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

export const setBaseAmount = createAction<{
  amount: string;
}>("v2/deposit/setBaseAmount");

export const setQuoteAmount = createAction<{
  amount: string;
}>("v2/deposit/setQuoteAmount");

export const setBaseTokenInfo = createAction<{
  token: TokenConfig;
}>("v2/deposit/setBaseTokenInfo");

export const setQuoteTokenInfo = createAction<{
  token: TokenConfig;
}>("v2/deposit/setQuoteTokenInfo");

export const setMethod = createAction<{
  method: string;
}>("v2/deposit/setMethod");

export const depositV2Reducer = createReducer(initialState, (builder) => {
  builder.addCase(setBaseAmount, (state, action) => {
    state.base.amount = action.payload.amount;
    console.info(state);
  });

  builder.addCase(setQuoteAmount, (state, action) => {
    state.quote.amount = action.payload.amount;
    console.info(state);
  });

  builder.addCase(setBaseTokenInfo, (state, action) => {
    state.base.token = action.payload.token;
    console.info(state);
  });

  builder.addCase(setQuoteTokenInfo, (state, action) => {
    state.quote.token = action.payload.token;
    console.info(state);
  });

  builder.addCase(setMethod, (state, action) => {
    state.method = action.payload.method;
  });
});
