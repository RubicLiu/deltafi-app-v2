import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getTokenConfigBySymbol } from "constants/deployConfigV2";
import { SwapCard } from "views/Swap/components/types";

interface TransactionResult {
  status: boolean | null;
  signature?: string;
  base?: SwapCard;
  quote?: SwapCard;
}

const initialState = {
  tokenFrom: {
    token: getTokenConfigBySymbol("SOL"),
    amount: "",
    amountWithSlippage: "",
  },
  tokenTo: {
    token: getTokenConfigBySymbol("USDC"),
    amount: "",
    amountWithSlippage: "",
  },
  transactionResult: null,
  isProcessing: false,
  priceImpact: "2.0",
  openSettings: false,
  withdrawPercentage: 0,
  openSnackbar: false,
  insufficientLiquidity: false,
};

const swapViewSlice = createSlice({
  name: "swapView",
  initialState,
  reducers: {
    setTokenFrom(state, action: PayloadAction<SwapCard>) {
      state.tokenFrom = action.payload;
    },

    setTokenTo(state, action: PayloadAction<SwapCard>) {
      state.tokenTo = action.payload;
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

    setInsufficientLiquidity(state, action: PayloadAction<{ insufficientLiquidity: boolean }>) {
      state.insufficientLiquidity = action.payload.insufficientLiquidity;
    },
  },
});

export const swapViewReducer = swapViewSlice.reducer;
export const swapViewActions = swapViewSlice.actions;
