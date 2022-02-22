import BigNumber from 'bignumber.js'

import { Multiplier } from 'lib/state'
import { PoolInfo } from 'providers/types'

export function getPrice(pool: PoolInfo) {
  const { poolState } = pool
  const { multiplier, baseReserve, baseTarget, quoteReserve, quoteTarget, marketPrice, slope } = poolState

  if (multiplier === Multiplier.BelowOne) {
    let m = new BigNumber(quoteTarget).multipliedBy(quoteTarget).dividedBy(quoteReserve).dividedBy(quoteReserve)
    m = m.multipliedBy(slope).plus(1).minus(slope)
    return m.multipliedBy(marketPrice).toNumber()
  } else {
    let m = new BigNumber(baseTarget).multipliedBy(baseTarget).dividedBy(baseReserve).dividedBy(baseReserve)
    m = m.multipliedBy(slope).plus(1).minus(slope)
    return m.multipliedBy(marketPrice).toNumber()
  }
}

export function getOutAmount(
  pool: PoolInfo,
  amount: string,
  fromTokenMint: string,
  toTokenMint: string,
  slippage: number,
) {
  const { baseTokenInfo, quoteTokenInfo } = pool
  const baseReserve = pool.poolState.baseReserve;
  const quoteReserve = pool.poolState.quoteReserve;
  const price = quoteReserve.dividedBy(baseReserve).times(10 ** baseTokenInfo.decimals).dividedBy(10 ** quoteTokenInfo.decimals);
  const fromAmount = new BigNumber(amount)
  let outAmount = new BigNumber(0)
  const percent = new BigNumber(100).plus(slippage).dividedBy(100)

  if (fromTokenMint === baseTokenInfo.address && toTokenMint === quoteTokenInfo.address) {
    outAmount = fromAmount.multipliedBy(price)
    outAmount = outAmount.multipliedBy(percent)
  } else if (fromTokenMint === quoteTokenInfo.address && toTokenMint === baseTokenInfo.address) {
    outAmount = fromAmount.dividedBy(price)
    outAmount = outAmount.multipliedBy(percent)
  }

  return outAmount.toNumber()
}
