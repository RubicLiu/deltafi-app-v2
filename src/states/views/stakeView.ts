import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import BigNumber from "bignumber.js";

interface TransactionResult {
  status: boolean | null;
  hash?: string;
  percentage?: number;
}

const initialState = {
  isProcessingStake: false,
  isProcessingClaim: false,
  transactionResult: null,
  openSnackbar: false,
  stake: {
    baseSelected: new BigNumber("0"),
    quoteSelected: new BigNumber("0"),
    percentage: 0,
  },
};

const stakeViewSlice = createSlice({
  name: "stakeView",
  initialState,
  reducers: {
    setPercentage(
      state,
      action: PayloadAction<{
        percentage: number;
        baseSelected: BigNumber;
        quoteSelected: BigNumber;
      }>,
    ) {
      state.stake.percentage = action.payload.percentage;
      state.stake.baseSelected = action.payload.baseSelected;
      state.stake.quoteSelected = action.payload.quoteSelected;
    },

    setTransactionResult(state, action: PayloadAction<{ transactionResult: TransactionResult }>) {
      state.transactionResult = action.payload.transactionResult;
    },

    setIsProcessingStake(state, action: PayloadAction<{ isProcessingStake: boolean }>) {
      state.isProcessingStake = action.payload.isProcessingStake;
    },

    setIsProcessingClaim(state, action: PayloadAction<{ isProcessingClaim: boolean }>) {
      state.isProcessingClaim = action.payload.isProcessingClaim;
    },

    setOpenSnackbar(state, action: PayloadAction<{ openSnackbar: boolean }>) {
      state.openSnackbar = action.payload.openSnackbar;
    },
  },
});

export const stakeViewReducer = stakeViewSlice.reducer;
export const stakeViewActions = stakeViewSlice.actions;
