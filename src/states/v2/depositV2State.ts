import { createReducer, createAction } from "@reduxjs/toolkit";
import { TokenConfig } from "constants/deployConfigV2";
import { SwapCard } from "views/Swap/components/types";

interface TransactionResult {
  status: boolean | null;
  action?: "deposit" | "withdraw";
  hash?: string;
  base?: SwapCard;
  quote?: SwapCard;
}

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
  transactionResult: null,
  isProcessing: false,
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

export const setTransactionResult = createAction<{
  transactionResult: TransactionResult;
}>("v2/deposit/setTransactionResult");

export const setIsProcessing = createAction<{
  isProcessing: boolean;
}>("v2/deposit/setIsProcessing");

export const depositV2Reducer = createReducer(initialState, (builder) => {
  builder.addCase(setTokenInfo, (state, action) => {
    state.base.token = action.payload.baseTokenInfo;
    state.base.amount = "0";
    state.base.amountWithSlippage = "0";
    state.quote.token = action.payload.quoteTokenInfo;
    state.quote.amount = "0";
    state.quote.amountWithSlippage = "0";
  });

  builder.addCase(setTokenAmount, (state, action) => {
    state.base.amount = action.payload.baseAmount;
    state.quote.amount = action.payload.quoteAmount;
  });

  builder.addCase(setMethod, (state, action) => {
    state.method = action.payload.method;
  });

  builder.addCase(setTransactionResult, (state, action) => {
    state.transactionResult = action.payload.transactionResult;
  });

  builder.addCase(setIsProcessing, (state, action) => {
    state.isProcessing = action.payload.isProcessing;
  });
});