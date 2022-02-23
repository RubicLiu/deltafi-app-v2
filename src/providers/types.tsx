import BigNumber from "bignumber.js";
import { AccountInfo, PublicKey } from "@solana/web3.js";

import { Fees, PoolState, Rewards, SwapType} from "lib/state";
import { PoolSchema } from "constants/pools";
import { TokenInfo } from "constants/tokens";
import { FarmPoolSchema } from "constants/farm";

export interface ConnectionContextValues {
  endpoint: string
  network: string
  setNetwork: (network: string) => void
}

export interface TokenAccount {
  pubkey: PublicKey
  account: AccountInfo<Buffer> | null
  effectiveMint: PublicKey
}

export interface ExTokenAccount {
  pubkey: PublicKey
  effectiveMint: PublicKey
  account: {
    mint: PublicKey
    owner: PublicKey
    amount: BigNumber
  }
}

export interface EndpointInfo {
  name: string
  endpoint: string
  custom: boolean
}

/**
 * {tokenMint: preferred token account's base58 encoded public key}
 */
export interface SelectedTokenAccounts {
  [tokenMint: string]: string
}

export interface ModalInfo {
  menuOpen: boolean
  menu: string
  address: PublicKey | null
  data: any
}

export interface ModalContextInfo {
  modalInfo: ModalInfo
  setMenu: (open: boolean, menu?: string, address?: PublicKey, data?: any) => void
}

export interface MarketConfig {
  verion: number
  publicKey: PublicKey
  bumpSeed: number
  deltafiMint: PublicKey
  oracleProgramId: PublicKey
  deltafiToken: PublicKey
}

export interface ConfigContextValues {
  config: MarketConfig
  setConfigAddress: (address: PublicKey) => void
}

export interface TokenAccountInfo {
  mint: PublicKey
  owner: PublicKey
  amount: BigNumber
}

export interface MintInfo {
  decimals: number
  initialized: boolean
  supply: BigNumber
}

export interface PoolContextValues {
  setSchema: (schema: PoolSchema) => void
}

export interface ConfigContextValues {
  config: MarketConfig
  setConfigAddress: (address: PublicKey) => void
}

export interface PoolInfo {
  name: string, 
  swapType: SwapType,
  publicKey: PublicKey
  nonce: number
  isPaused: boolean
  baseTokenInfo: TokenInfo
  quoteTokenInfo: TokenInfo
  base: PublicKey
  quote: PublicKey
  pythBase: PublicKey
  pythQuote: PublicKey
  poolMintKey: PublicKey
  baseFee: PublicKey
  quoteFee: PublicKey
  fees: Fees
  rewards: Rewards
  poolState: PoolState
}

export interface PoolContextValues {
  setSchema: (schema: PoolSchema) => void
}

export interface EntirePoolsContextValues {
  pools: PoolInfo[]
  schemas: PoolSchema[]
  setSchemas: (schemas: PoolSchema[]) => void
}

export interface TokenAccount {
  pubkey: PublicKey
  account: AccountInfo<Buffer> | null
  effectiveMint: PublicKey
}

export interface FarmPoolsContextValues {
  pools: FarmPoolInfo[]
  schemas: FarmPoolSchema[]
  setSchemas: (schemas: FarmPoolSchema[]) => void
}

export interface FarmPoolInfo {
  name: string
  publicKey: PublicKey
  bumpSeed: number
  poolAddress: PublicKey
  poolMintKey: PublicKey
  poolToken: PublicKey
  baseTokenInfo: TokenInfo
  quoteTokenInfo: TokenInfo
  reservedAmount: bigint
  aprNumerator: bigint
  aprDenominator: bigint
}

export interface StakeAccount {
  depositBalance: BigNumber
  rewardDebt: BigNumber
  rewardEstimated: BigNumber
  lastUpdateTs: BigNumber
  nextClaimTs: BigNumber
}

interface ISymbolMap {
  [index: string]: object
}

export interface PythContextValue {
  symbolMap: ISymbolMap
  isLoading: boolean
  numProducts: number
  error: any
  setFilters: (filters: string[]) => void
}
