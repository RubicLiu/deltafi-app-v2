import { struct, u8 } from 'buffer-layout'
import BigNumber from 'bignumber.js'

import { decimal, u64 } from 'utils/layout'

export interface InitializeData {
  nonce: number
  slope: number | bigint
  midPrice: BigNumber
}

/** @internal */
export const InitializeDataLayout = struct<InitializeData>([u8('nonce'), u64('slop'), decimal('midPrice')], 'initData')

export interface DepositData {
  amountTokenA: bigint
  amountTokenB: bigint
  amountMintMin: bigint
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
