import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, u8 } from "buffer-layout";
import {
  SwapData,
  SwapDataLayout,
  DepositData,
  DepositDataLayout,
  WithdrawData,
  WithdrawDataLayout,
} from "./dataLayout";

export enum StableSwapInstruction {
  Initialize = 10,
  Swap,
  Deposit,
  Withdraw,
}

export const createStableSwapInstruction = (
  config: PublicKey,
  tokenSwap: PublicKey,
  marketAuthority: PublicKey,
  swapAuthority: PublicKey,
  userTransferAuthority: PublicKey,
  source: PublicKey,
  swapSource: PublicKey,
  sourceMint: PublicKey,
  swapDestination: PublicKey,
  destination: PublicKey,
  destinationMint: PublicKey,
  rewardToken: PublicKey,
  sourceRewardToken: PublicKey,
  adminFeeDestination: PublicKey,
  swapData: SwapData,
  programId: PublicKey,
) => {
  const keys = [
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: tokenSwap, isSigner: false, isWritable: true },
    { pubkey: marketAuthority, isSigner: false, isWritable: false },
    { pubkey: swapAuthority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: swapSource, isSigner: false, isWritable: true },
    { pubkey: sourceMint, isSigner: false, isWritable: false },
    { pubkey: swapDestination, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: destinationMint, isSigner: false, isWritable: false },
    { pubkey: rewardToken, isSigner: false, isWritable: true },
    { pubkey: sourceRewardToken, isSigner: false, isWritable: true },
    { pubkey: adminFeeDestination, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const dataLayout = struct([u8("instruction"), SwapDataLayout]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: StableSwapInstruction.Swap,
      swapData,
    },
    data,
  );

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};

export const createStableDepositInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  depositTokenA: PublicKey,
  depositTokenB: PublicKey,
  swapTokenA: PublicKey,
  swapTokenB: PublicKey,
  poolMint: PublicKey,
  destination: PublicKey,
  depositData: DepositData,
  programId: PublicKey,
) => {
  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: depositTokenA, isSigner: false, isWritable: true },
    { pubkey: depositTokenB, isSigner: false, isWritable: true },
    { pubkey: swapTokenA, isSigner: false, isWritable: true },
    { pubkey: swapTokenB, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const dataLayout = struct([u8("instruction"), DepositDataLayout]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: StableSwapInstruction.Deposit,
      depositData,
    },
    data,
  );

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};

export const createStableWithdrawInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  source: PublicKey,
  swapTokenA: PublicKey,
  swapTokenB: PublicKey,
  destinationTokenA: PublicKey,
  destinationTokenB: PublicKey,
  poolMint: PublicKey,
  adminFeeA: PublicKey,
  adminFeeB: PublicKey,
  withdrawData: WithdrawData,
  programId: PublicKey,
) => {
  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: swapTokenA, isSigner: false, isWritable: true },
    { pubkey: swapTokenB, isSigner: false, isWritable: true },
    { pubkey: destinationTokenA, isSigner: false, isWritable: true },
    { pubkey: destinationTokenB, isSigner: false, isWritable: true },
    { pubkey: adminFeeA, isSigner: false, isWritable: true },
    { pubkey: adminFeeB, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const dataLayout = struct([u8("instruction"), WithdrawDataLayout]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: StableSwapInstruction.Withdraw,
      withdrawData,
    },
    data,
  );

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};
