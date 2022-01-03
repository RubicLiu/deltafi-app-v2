import { struct } from 'buffer-layout'
import { bool, u64 } from 'utils/layout'

export interface Rewards {
  isInitialized: boolean
  tradeRewardNumerator: bigint
  tradeRewardDenominator: bigint
  tradeRewardCap: bigint
}

/** @internal */
export const RewardsLayout = (property = 'rewards') =>
  struct<Rewards>(
    [
      bool('isInitialized'),
      u64('tradeRewardNumerator'),
      u64('tradeRewardDenominator'),
      u64('tradeRewardCap'),
    ],
    property,
  )
