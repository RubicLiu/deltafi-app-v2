import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SwapCard } from "views/Swap/components/types";
import { TokenConfig } from "constants/deployConfigV2";

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
  withdrawPercentage: 0,
  openSnackbar: false,
};

const stakeV2Slice = createSlice({
  name: "stakeV2",
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
      state.base.amountWithSlippage = "0";
      state.quote.token = action.payload.quoteTokenInfo;
      state.quote.amount = "0";
      state.quote.amountWithSlippage = "0";
    },

    setTokenAmount(
      state,
      action: PayloadAction<{
        baseAmount: string;
        quoteAmount: string;
      }>,
    ) {
      state.base.amount = action.payload.baseAmount;
      state.quote.amount = action.payload.quoteAmount;
    },

    setMethod(
      state,
      action: PayloadAction<{
        method: string;
      }>,
    ) {
      state.method = action.payload.method;
      state.withdrawPercentage = 0;
    },

    setTransactionResult(
      state,
      action: PayloadAction<{
        transactionResult: TransactionResult;
      }>,
    ) {
      state.transactionResult = action.payload.transactionResult;
    },

    setIsProcessing(
      state,
      action: PayloadAction<{
        isProcessing: boolean;
      }>,
    ) {
      state.isProcessing = action.payload.isProcessing;
    },

    setWithdrawPercentage(
      state,
      action: PayloadAction<{
        withdrawPercentage: number;
      }>,
    ) {
      state.withdrawPercentage = action.payload.withdrawPercentage;
    },

    setOpenSnackbar(
      state,
      action: PayloadAction<{
        openSnackbar: boolean;
      }>,
    ) {
      state.openSnackbar = action.payload.openSnackbar;
    },
  },
});

export const stakeV2Reducer = stakeV2Slice.reducer;
export const stakeV2Actions = stakeV2Slice.actions;
