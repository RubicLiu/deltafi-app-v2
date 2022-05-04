import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StakeCard } from "views/Stake/components/types";

interface TransactionResult {
  status: boolean | null;
  action?: "deposit" | "withdraw";
  hash?: string;
  stake?: StakeCard;
}

const initialState = {
  isProcessingStake: false,
  isProcessingClaim: false,
  transactionResult: null,
  openSnackbar: false,
};

const stakeV2Slice = createSlice({
  name: "stakeV2",
  initialState,
  reducers: {
    setTransactionResult(state, action: PayloadAction<{ transactionResult: TransactionResult }>) {
      state.transactionResult = action.payload.transactionResult;
    },

    setIsProcessingStake(state, action: PayloadAction<{ isProcessingStake: boolean }>) {
      state.isProcessingStake = action.payload.isProcessingStake;
    },

    setIsProcessingClaim(state, action: PayloadAction<{ isProcessingClaim: boolean }>) {
      state.isProcessingStake = action.payload.isProcessingClaim;
    },

    setOpenSnackbar(state, action: PayloadAction<{ openSnackbar: boolean }>) {
      state.openSnackbar = action.payload.openSnackbar;
    },
  },
});

export const stakeV2Reducer = stakeV2Slice.reducer;
export const stakeV2Actions = stakeV2Slice.actions;
