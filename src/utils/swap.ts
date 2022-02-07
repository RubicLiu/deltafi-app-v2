import BigNumber from 'bignumber.js'
import { PoolInfo } from 'providers/types'
import { PMMState, PMMHelper } from 'lib/calc/pmm/index'
import { exponentiate, exponentiatedBy } from './decimal'

export function getSwapOutAmount(
  pool: PoolInfo,
  fromTokenMint: string,
  toTokenMint: string,
  amount: string,
  slippage: number,
) {
  const { poolState, fees, baseTokenInfo, quoteTokenInfo } = pool
  const pmmHelper = new PMMHelper()
  const { tradeFeeNumerator, tradeFeeDenominator, adminTradeFeeNumerator, adminTradeFeeDenominator } = fees
  const tradeFeeNumerator1 = new BigNumber(tradeFeeNumerator.toString())
  const tradeFeeDenominator1 = new BigNumber(tradeFeeDenominator.toString())
  const adminFeeNumerator1 = new BigNumber(adminTradeFeeNumerator.toString())
  const adminFeeDenominator1 = new BigNumber(adminTradeFeeDenominator.toString())
  const pmmState = new PMMState({
    B: poolState.baseReserve,
    Q: poolState.quoteReserve,
    B0: poolState.baseTarget,
    Q0: poolState.quoteTarget,
    R: poolState.multiplier as number,
    i: poolState.marketPrice,
    K: poolState.slope,
    mtFeeRate: tradeFeeNumerator1.dividedBy(tradeFeeDenominator1),
    lpFeeRate: adminFeeDenominator1.minus(adminFeeNumerator1).dividedBy(adminFeeDenominator1),
  })

  if (fromTokenMint === baseTokenInfo.address && toTokenMint === quoteTokenInfo.address) {
    const baseAmount = exponentiate(amount, baseTokenInfo.decimals)
    const quoteAmount = pmmHelper.querySellBase(baseAmount, pmmState)
    const fee = quoteAmount.multipliedBy(pmmState.mtFeeRate)
    const lpFee = fee.multipliedBy(pmmState.lpFeeRate)
    const quoteAmountWithSlippage = quoteAmount.multipliedBy(100 - slippage).dividedBy(100)
    /**
     * calc price impact
     */
    const baseBalance = poolState.baseReserve.plus(baseAmount)
    const quoteBalance = poolState.quoteReserve.minus(quoteAmount)
    const beforePrice = exponentiate(
      exponentiatedBy(poolState.quoteReserve, quoteTokenInfo.decimals).dividedBy(
        exponentiatedBy(poolState.baseReserve, baseTokenInfo.decimals),
      ),
      quoteTokenInfo.decimals,
    )
    const afterPrice = exponentiate(
      exponentiatedBy(quoteBalance, quoteTokenInfo.decimals).dividedBy(
        exponentiatedBy(baseBalance, baseTokenInfo.decimals),
      ),
      quoteTokenInfo.decimals,
    )
    const priceImpact = beforePrice.minus(afterPrice).abs().dividedBy(beforePrice).multipliedBy(100).toNumber()
    return {
      amountIn: parseFloat(amount),
      amountOut: exponentiatedBy(quoteAmount, baseTokenInfo.decimals).toNumber(),
      amountOutWithSlippage: exponentiatedBy(quoteAmountWithSlippage, quoteTokenInfo.decimals).toNumber(),
      lpFee: exponentiatedBy(lpFee, quoteTokenInfo.decimals).toNumber(),
      priceImpact,
    }
  } else {
    const quoteAmount = exponentiate(amount, quoteTokenInfo.decimals)
    const baseAmount = pmmHelper.querySellQuote(quoteAmount, pmmState)
    const fee = baseAmount.multipliedBy(tradeFeeNumerator1).dividedBy(tradeFeeDenominator1)
    const lpFee = fee.multipliedBy(adminFeeDenominator1.minus(adminFeeNumerator1)).dividedBy(adminFeeDenominator1)
    const baseAmountWithSlippage = baseAmount.multipliedBy(100 - slippage).dividedBy(100)
    const baseBalance = poolState.baseReserve.minus(baseAmount)
    const quoteBalance = poolState.quoteReserve.plus(quoteAmount)
    const beforePrice = exponentiate(
      exponentiatedBy(poolState.quoteReserve, quoteTokenInfo.decimals).dividedBy(
        exponentiatedBy(poolState.baseReserve, baseTokenInfo.decimals),
      ),
      quoteTokenInfo.decimals,
    )
    const afterPrice = exponentiate(
      exponentiatedBy(quoteBalance, quoteTokenInfo.decimals).dividedBy(
        exponentiatedBy(baseBalance, baseTokenInfo.decimals),
      ),
      quoteTokenInfo.decimals,
    )
    const priceImpact = beforePrice.minus(afterPrice).abs().dividedBy(beforePrice).multipliedBy(100).toNumber()
    return {
      amountIn: parseFloat(amount),
      amountOut: exponentiatedBy(baseAmount, quoteTokenInfo.decimals).toNumber(),
      amountOutWithSlippage: exponentiatedBy(baseAmountWithSlippage, quoteTokenInfo.decimals).toNumber(),
      lpFee: exponentiatedBy(lpFee, quoteTokenInfo.decimals).toNumber(),
      priceImpact,
    }
  }
}
