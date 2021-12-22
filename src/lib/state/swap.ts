import { AccountInfo, PublicKey, Connection } from '@solana/web3.js'
import { struct, u8 } from 'buffer-layout'
import BigNumber from 'bignumber.js'

import { AccountParser, bool, decimal, publicKey, u64 } from 'utils/layout'
import { loadAccount } from 'utils/account'

import { Fees, FeesLayout } from './fees'
import { Rewards, RewardsLayout } from './rewards'
import { PoolState, PoolStateLayout } from './pool-state'

export enum SwapType {
  /// Standard swap pool with external price
  Normal = 0,
  /// Stable swap pool
  Stable,
}

export interface SwapInfo {
  isInitialized: boolean
  isPaused: boolean
  nonce: number
  swapType: SwapType
  configKey: PublicKey
  tokenA: PublicKey
  tokenB: PublicKey
  pythA: PublicKey
  pythB: PublicKey
  poolMint: PublicKey
  tokenMintA: PublicKey
  tokenMintB: PublicKey
  adminFeeKeyA: PublicKey
  adminFeeKeyB: PublicKey
  fees: Fees
  rewards: Rewards
  poolState: PoolState
  isOpenTwap: boolean
  blockTimestampLast: bigint
  cumulativeTicks: bigint
  basePriceCumulativeLast: BigNumber
}

/** @internal */
export const SwapInfoLayout = struct<SwapInfo>(
  [
    bool('isInitialized'),
    bool('isPaused'),
    u8('nonce'),
    u8('swapType'),
    publicKey('configKey'),
    publicKey('tokenA'),
    publicKey('tokenB'),
    publicKey('pythA'),
    publicKey('pythB'),
    publicKey('poolMint'),
    publicKey('tokenMintA'),
    publicKey('tokenMintB'),
    publicKey('adminFeeKeyA'),
    publicKey('adminFeeKeyB'),
    FeesLayout('fees'),
    RewardsLayout('rewards'),
    PoolStateLayout('poolState'),
    u8('isOpenTwap'),
    u64('blockTimestampLast'),
    u64('cumulativeTicks'),
    decimal('basePriceCumulativeLast'),
  ],
  'swapInfo',
)

export const SWAP_INFO_SIZE = SwapInfoLayout.span

export const isSwapInfo = (info: AccountInfo<Buffer>): boolean => {
  return info.data.length === SWAP_INFO_SIZE
}

export const parseSwapInfo: AccountParser<SwapInfo> = (info: AccountInfo<Buffer>) => {
  if (!isSwapInfo(info)) return

  const buffer = Buffer.from(info.data)
  const swapInfo = SwapInfoLayout.decode(buffer)

  if (!swapInfo.isInitialized) return

  return {
    info,
    data: swapInfo,
  }
}

export const loadSwapInfo = async (
  connection: Connection,
  key: string,
  swapProgramId: PublicKey,
): Promise<{ data: SwapInfo; key: string }> => {
  const address = new PublicKey(key)
  const accountInfo = await loadAccount(connection, address, swapProgramId)

  const parsed = parseSwapInfo(accountInfo)

  if (!parsed) throw new Error('Failed to load configuration account')

  return { data: parsed.data, key }
}
