import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";
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
  // TODO(ypeng): Update stake card content to match v2
  stake: {
    poolConfig: null,
    isStake: true,
    balance: new BigNumber("0"),
    baseBalance: new BigNumber("0"),
    quoteBalance: new BigNumber("0"),
    amount: "0",
    baseAmount: "0",
    quoteAmount: "0",
    percentage: 0,
  },
};

const stakeV2Slice = createSlice({
  name: "stakeV2",
  initialState,
  reducers: {
    setPoolConfig(state, action: PayloadAction<{ poolConfig: PoolConfig }>) {
      state.stake = {
        poolConfig: action.payload.poolConfig,
        isStake: true,
        balance: new BigNumber("0"),
        baseBalance: new BigNumber("0"),
        quoteBalance: new BigNumber("0"),
        amount: "0",
        baseAmount: "0",
        quoteAmount: "0",
        percentage: 0,
      };
    },

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

    setBalance(state, action: PayloadAction<{ balance: BigNumber }>) {
      state.stake.balance = action.payload.balance;
    },

    setIsStake(
      state,
      action: PayloadAction<{
        isStake: boolean;
        baseBalance: BigNumber;
        quoteBalance: BigNumber;
      }>,
    ) {
      state.stake.isStake = action.payload.isStake;
      state.stake.baseBalance = action.payload.baseBalance;
      state.stake.quoteBalance = action.payload.quoteBalance;
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

export const stakeV2Reducer = stakeV2Slice.reducer;
export const stakeV2Actions = stakeV2Slice.actions;
