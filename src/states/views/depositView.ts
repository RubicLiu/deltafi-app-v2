import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TokenConfig } from "constants/deployConfigV2";
import { IDepositCard } from "views/Deposit/components/DepositCard/types";

interface TransactionResult {
  status: boolean | null;
  action?: "deposit" | "withdraw" | "claim";
  hash?: string;
  base?: IDepositCard;
  quote?: IDepositCard;
}

const initialState = {
  method: "deposit",
  base: {
    token: null,
    amount: "0",
    totalAmount: "0",
  },
  quote: {
    token: null,
    amount: "0",
    maxAmount: "0",
  },
  transactionResult: null,
  isProcessing: false,
  withdrawPercentage: 0,
  openSnackbar: false,
  currentUnixTimestamp: Math.floor(Date.now() / 1000),
};

const depositViewSlice = createSlice({
  name: "depositView",
  initialState,
  reducers: {
    setTokenInfo(
      state,
      action: PayloadAction<{
        baseTokenInfo: TokenConfig;
        quoteTokenInfo: TokenConfig;
      }>,
    ) {
      state.base.token = action.payload.baseTokenInfo;
      state.base.amount = "0";
      state.base.totalAmount = "0";
      state.quote.token = action.payload.quoteTokenInfo;
      state.quote.amount = "0";
      state.quote.maxAmount = "0";
    },

    setTokenAmount(state, action: PayloadAction<{ baseAmount: string; quoteAmount: string }>) {
      state.base.amount = action.payload.baseAmount;
      state.quote.amount = action.payload.quoteAmount;
    },

    setMethod(state, action: PayloadAction<{ method: string }>) {
      state.method = action.payload.method;
      state.withdrawPercentage = 0;
    },

    setTransactionResult(state, action: PayloadAction<{ transactionResult: TransactionResult }>) {
      state.transactionResult = action.payload.transactionResult;
    },

    setIsProcessing(state, action: PayloadAction<{ isProcessing: boolean }>) {
      state.isProcessing = action.payload.isProcessing;
    },

    setWithdrawPercentage(state, action: PayloadAction<{ withdrawPercentage: number }>) {
      state.withdrawPercentage = action.payload.withdrawPercentage;
    },

    setOpenSnackbar(state, action: PayloadAction<{ openSnackbar: boolean }>) {
      state.openSnackbar = action.payload.openSnackbar;
    },

    updateCurrentUnixTimestamp(state) {
      state.currentUnixTimestamp = Math.floor(Date.now() / 1000);
    },
  },
});

export const depositViewReducer = depositViewSlice.reducer;
export const depositViewActions = depositViewSlice.actions;
