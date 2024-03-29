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
  maxSlippage: "1.0",
  priceImpact: "--",
  openSettings: false,
  withdrawPercentage: 0,
  openSnackbar: false,
  insufficientLiquidity: false,
  insufficientBalance: false,
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

    setMaxSlippage(state, action: PayloadAction<{ maxSlippage: string }>) {
      state.maxSlippage = action.payload.maxSlippage;
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
    setInsufficientBalance(state, action: PayloadAction<{ insufficientBalance: boolean }>) {
      state.insufficientBalance = action.payload.insufficientBalance;
    },
  },
});

export const swapViewReducer = swapViewSlice.reducer;
export const swapViewActions = swapViewSlice.actions;
