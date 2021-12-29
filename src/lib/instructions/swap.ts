import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js'
import { struct, u8 } from 'buffer-layout'
import BigNumber from 'bignumber.js'

import { decimal, u64 } from 'utils/layout'

export enum SwapInstruction {
  Initialize = 0,
  Swap,
  Deposit,
  DepositOne,
  Withdraw,
  WithdrawOne,
}

export interface InitializeData {
  nonce: number
  slope: number | bigint
  midPrice: BigNumber
}

/** @internal */
export const InitializeDataLayout = struct<InitializeData>([u8('nonce'), u64('slop'), decimal('midPrice')], 'initData')

export const createInitSwapInstruction = (
  config: PublicKey,
  tokenSwap: PublicKey,
  authority: PublicKey,
  adminFeeKeyA: PublicKey,
  adminFeeKeyB: PublicKey,
  tokenA: PublicKey,
  tokenB: PublicKey,
  poolMint: PublicKey,
  poolToken: PublicKey,
  pythProductA: PublicKey,
  pythPriceA: PublicKey,
  pythProductB: PublicKey,
  pythPriceB: PublicKey,
  initData: InitializeData,
  programId: PublicKey,
): TransactionInstruction => {
  const keys = [
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: tokenSwap, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: adminFeeKeyA, isSigner: false, isWritable: false },
    { pubkey: adminFeeKeyB, isSigner: false, isWritable: false },
    { pubkey: tokenA, isSigner: false, isWritable: false },
    { pubkey: tokenB, isSigner: false, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: poolToken, isSigner: false, isWritable: true },
    { pubkey: pythProductA, isSigner: false, isWritable: false },
    { pubkey: pythPriceA, isSigner: false, isWritable: false },
    { pubkey: pythProductB, isSigner: false, isWritable: false },
    { pubkey: pythPriceB, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]
  const dataLayout = struct([u8('instruction'), InitializeDataLayout])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: SwapInstruction.Initialize,
      initData,
    },
    data,
  )

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}

export interface SwapData {
  amountIn: bigint
  minimumAmountOut: bigint
  swapDirection: SWAP_DIRECTION
}

export enum SWAP_DIRECTION {
  SellBase = 0,
  SellQuote,
}

/** @internal */
export const SwapDataLayout = struct<SwapData>(
  [u64('amountIn'), u64('minimumAmountOut'), u8('swapDirection')],
  'swapData',
)

export const createSwapInstruction = (
  config: PublicKey,
  tokenSwap: PublicKey,
  marketAuthority: PublicKey,
  swapAuthority: PublicKey,
  userTransferAuthority: PublicKey,
  source: PublicKey,
  swapSource: PublicKey,
  swapDestination: PublicKey,
  destination: PublicKey,
  rewardToken: PublicKey,
  rewardMint: PublicKey,
  adminFeeDestination: PublicKey,
  pythA: PublicKey,
  pythB: PublicKey,
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
    { pubkey: swapDestination, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: rewardToken, isSigner: false, isWritable: true },
    { pubkey: rewardMint, isSigner: false, isWritable: true },
    { pubkey: adminFeeDestination, isSigner: false, isWritable: true },
    { pubkey: pythA, isSigner: false, isWritable: false },
    { pubkey: pythB, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const dataLayout = struct([u8('instruction'), SwapDataLayout])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: SwapInstruction.Swap,
      swapData,
    },
    data,
  )

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}

export interface DepositData {
  amountTokenA: bigint
  amountTokenB: bigint
  amountMintMin: bigint
}

/** @internal */
export const DepositDataLayout = struct<DepositData>(
  [u64('amountTokenA'), u64('amountTokenB'), u64('amountMintMin')],
  'depositData',
)

export const createDepositInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  depositTokenA: PublicKey,
  depositTokenB: PublicKey,
  swapTokenA: PublicKey,
  swapTokenB: PublicKey,
  poolMint: PublicKey,
  destination: PublicKey,
  pythA: PublicKey,
  pythB: PublicKey,
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
    { pubkey: pythA, isSigner: false, isWritable: false },
    { pubkey: pythB, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const dataLayout = struct([u8('instruction'), DepositDataLayout])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: SwapInstruction.Deposit,
      depositData,
    },
    data,
  )

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}

export interface DepositOneData {
  tokenAmount: bigint
  minMintAmount: bigint
}

/** @internal */
export const DepositOneDataLayout = struct<DepositOneData>([u64('tokenAmount'), u64('minMintAmount')], 'depositOneData')

export const createDepositOneInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  source: PublicKey,
  swapSource: PublicKey,
  poolMint: PublicKey,
  destination: PublicKey,
  pythA: PublicKey,
  pythB: PublicKey,
  depositData: DepositOneData,
  programId: PublicKey,
) => {
  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: swapSource, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: pythA, isSigner: false, isWritable: false },
    { pubkey: pythB, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const dataLayout = struct([u8('instruction'), DepositOneDataLayout])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: SwapInstruction.DepositOne,
      depositData,
    },
    data,
  )

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}

export interface WithdrawData {
  amountPoolToken: bigint
  minAmountTokenA: bigint
  minAmountTokenB: bigint
}

/** @internal */
export const WithdrawDataLayout = struct<WithdrawData>(
  [u64('amountPoolToken'), u64('minAmountTokenA'), u64('minAmountTokenB')],
  'withdrawData',
)

export const createWithdrawInstruction = (
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
  pythA: PublicKey,
  pythB: PublicKey,
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
    { pubkey: pythA, isSigner: false, isWritable: false },
    { pubkey: pythB, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const dataLayout = struct([u8('instruction'), WithdrawDataLayout])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: SwapInstruction.Withdraw,
      withdrawData,
    },
    data,
  )

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}

export interface WithdrawOneData {
  amountPoolToken: bigint
  minTokenAmount: bigint
}

/** @internal */
export const WithdrawOneDataLayout = struct<WithdrawOneData>(
  [u64('amountPoolToken'), u64('minTokenAmount')],
  'withdrawOneData',
)

export const createWithdrawOneInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  source: PublicKey,
  poolMint: PublicKey,
  swapDestination: PublicKey,
  destination: PublicKey,
  adminFeeDestination: PublicKey,
  pythA: PublicKey,
  pythB: PublicKey,
  withdrawData: WithdrawOneData,
  programId: PublicKey,
) => {
  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: swapDestination, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: adminFeeDestination, isSigner: false, isWritable: true },
    { pubkey: pythA, isSigner: false, isWritable: false },
    { pubkey: pythB, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const dataLayout = struct([u8('instruction'), WithdrawOneDataLayout])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: SwapInstruction.WithdrawOne,
      withdrawData,
    },
    data,
  )

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}
