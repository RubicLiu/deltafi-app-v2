import { struct } from 'buffer-layout'
import { u64 } from 'utils/layout'

export interface Rewards {
  tradeRewardNumerator: bigint
  tradeRewardDenominator: bigint
  tradeRewardCap: bigint
  liquidityRewardNumerator: bigint
  liquidityRewardDenominator: bigint
}

/** @internal */
export const RewardsLayout = (property = 'rewards') =>
  struct<Rewards>(
    [
      u64('tradeRewardNumerator'),
      u64('tradeRewardDenominator'),
      u64('tradeRewardCap'),
      u64('liquidityRewardNumerator'),
      u64('liquidityRewardDenominator'),
    ],
    property,
  )
