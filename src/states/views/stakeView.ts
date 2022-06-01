import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import BigNumber from "bignumber.js";
import { StakeCard } from "views/Stake/components/types";

interface TransactionResult {
  status: boolean | null;
  action?: "stake" | "unstake" | "claim";
  hash?: string;
  stake?: StakeCard;
}

const initialState = {
  isProcessingStake: false,
  isProcessingClaim: false,
  transactionResult: null,
  openSnackbar: false,
  stake: {
    baseBalance: new BigNumber("0"),
    quoteBalance: new BigNumber("0"),
    baseStaked: new BigNumber("0"),
    quoteStaked: new BigNumber("0"),
    baseAmount: "0",
    quoteAmount: "0",
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
        baseAmount: string;
        quoteAmount: string;
      }>,
    ) {
      state.stake.percentage = action.payload.percentage;
      state.stake.baseAmount = action.payload.baseAmount;
      state.stake.quoteAmount = action.payload.quoteAmount;
    },

    setBalance(
      state,
      action: PayloadAction<{
        baseBalance: BigNumber;
        quoteBalance: BigNumber;
        baseStaked: BigNumber;
        quoteStaked: BigNumber;
      }>,
    ) {
      state.stake.baseBalance = action.payload.baseBalance;
      state.stake.quoteBalance = action.payload.quoteBalance;
      state.stake.baseStaked = action.payload.baseStaked;
      state.stake.quoteStaked = action.payload.quoteStaked;
      state.stake.percentage = 0;
      state.stake.baseAmount = "0";
      state.stake.quoteAmount = "0";
    },

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

export const stakeViewReducer = stakeViewSlice.reducer;
export const stakeViewActions = stakeViewSlice.actions;
