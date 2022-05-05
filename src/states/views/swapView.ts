import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SwapCard } from "views/Swap/components/types";

interface TransactionResult {
  status: boolean | null;
  signature?: string;
  base?: SwapCard;
  quote?: SwapCard;
}

const initialState = {
  method: "deposit",
  fromToken: {
    token: null,
    amount: "0",
    amountWithSlippage: "0",
  },
  toToken: {
    token: null,
    amount: "0",
    amountWithSlippage: "0",
  },
  transactionResult: null,
  isProcessing: false,
  priceImpact: "2.0",
  openSettings: false,
  withdrawPercentage: 0,
  openSnackbar: false,
};

const swapViewSlice = createSlice({
  name: "swapView",
  initialState,
  reducers: {
    setFromToken(state, action: PayloadAction<{ swapCard: SwapCard }>) {
      state.fromToken = action.payload.swapCard;
    },

    setToToken(state, action: PayloadAction<{ swapCard: SwapCard }>) {
      state.toToken = action.payload.swapCard;
    },

    setTransactionResult(state, action: PayloadAction<{ transactionResult: TransactionResult }>) {
      state.transactionResult = action.payload.transactionResult;
    },

    setIsProcessing(state, action: PayloadAction<{ isProcessing: boolean }>) {
      state.isProcessing = action.payload.isProcessing;
    },

    setPriceImpact(state, action: PayloadAction<{ priceImpact: string }>) {
      state.priceImpact = action.payload.priceImpact;
    },

    setOpenSettings(state, action: PayloadAction<{ openSettings: boolean }>) {
      state.openSettings = action.payload.openSettings;
    },

    setOpenSnackbar(state, action: PayloadAction<{ openSnackbar: boolean }>) {
      state.openSnackbar = action.payload.openSnackbar;
    },
  },
});

export const swapViewReducer = swapViewSlice.reducer;
export const swapViewActions = swapViewSlice.actions;
