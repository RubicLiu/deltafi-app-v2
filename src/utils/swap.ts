import BigNumber from "bignumber.js";
import { PoolInfo } from "providers/types";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfigV2";
import { Fees, PoolState, SwapType } from "lib/state";

/**
 * Main interface function of this module, calculate the output information
 * of a swap with the swap input information
 * @param pool pool's information, includes pool state, pool's configs of fees and all tokens and token accounts info
 * @param fromToken info of the input token
 * @param toToken info of the output token
 * @param amount amount of the input token to be traded
 * @param maxSlippage max maxSlippage limit, in percentage
 * @param marketPrice basePrice / quotePrice
 * @param marketPriceHigh upper bound of the market price after confidence interval adjustion
 * @param marketPriceLow lower bound of the market price after confidence interval adjustion
 * @returns amount out information
 */
export function getSwapOutAmount(
  pool: PoolInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amount: string,
  maxSlippage: number,
  marketPrice: BigNumber,
  marketPriceLow?: BigNumber,
  marketPriceHigh?: BigNumber,
): {
  amountIn: number;
  amountOut: number;
  amountOutWithSlippage: number;
  fee: number;
  priceImpact: number;
} {
  // TODO(leqiang): use v2 formula
  // if the confidence interval is not enabled, we use fair market price for both adjusted
  // market price
  if (!(marketPriceHigh && marketPriceLow) || pool.enableConfidenceInterval === false) {
    marketPriceHigh = marketPrice;
    marketPriceLow = marketPrice;
  }

  if (fromToken.mint === pool.base.toBase58() && toToken.mint === pool.quote.toBase58()) {
    // sell base case
    const rawAmountOut: number = getSwapOutAmountSellBase(
      pool.poolState,
      new BigNumber(amount),
      marketPriceLow,
      pool.swapType,
    );

    return generateResultFromAmountOut(
      pool.poolState.baseReserve,
      pool.poolState.quoteReserve,
      parseFloat(amount),
      rawAmountOut,
      maxSlippage,
      pool.fees,
    );
  } else if (fromToken.mint === pool.quote.toBase58() && toToken.mint === pool.base.toBase58()) {
    // sell quote case
    const rawAmountOut: number = getSwapOutAmountSellQuote(
      pool.poolState,
      new BigNumber(amount),
      marketPriceHigh,
      pool.swapType,
    );

    return generateResultFromAmountOut(
      pool.poolState.quoteReserve,
      pool.poolState.baseReserve,
      parseFloat(amount),
      rawAmountOut,
      maxSlippage,
      pool.fees,
    );
  }

  // if the above if - else-if condition is not satisfied
  // the input from/to mint addresses do not match the pool's base and quote mint address
  throw Error(
    "Wrong to and from token mint: " +
      toToken.mint +
      " " +
      fromToken.mint +
      ", pool's base and quote tokens are: " +
      pool.base.toBase58() +
      " " +
      pool.quote.toBase58(),
  );
}

/**
 * Calculate out amount when selling base, reserve A is base reserve, reserve B is quote reserve
 * @param poolState pool state information, includes the current reserve and target amounts of the tokens
 * @param amountIn base token input amount
 * @param marketPrice baseTokenPrice / quoteTokenPrice
 * @param swapType normal swap or stable swap
 * @returns quote token amount out calculated from the curve formulas
 */
export function getSwapOutAmountSellBase(
  poolState: PoolState,
  amountIn: BigNumber,
  marketPrice: BigNumber,
  swapType: SwapType,
): number {
  switch (swapType) {
    case SwapType.Normal:
      return calculateOutAmountNormalSwap(
        marketPrice,
        poolState.baseTarget,
        poolState.quoteTarget,
        poolState.baseReserve,
        poolState.quoteReserve,
        amountIn,
      );
    case SwapType.Stable:
      return calculateOutAmountStableSwap(
        marketPrice,
        poolState.baseReserve,
        poolState.quoteReserve,
        amountIn,
        poolState.slope,
      );
    default:
      throw Error("Wrong swaptype: " + swapType);
  }
}

/**
 * Calculates out amount when selling base, reserve A is quote reserve, reserve B is base reserve
 * @param poolState pool state information, includes the current reserve and target amounts of the tokens
 * @param amountIn quote token input amount
 * @param marketPrice baseTokenPrice / quoteTokenPrice
 * @param swapType normal swap or stable swap
 * @returns base token amount out calculated from the curve formulas
 */
export function getSwapOutAmountSellQuote(
  poolState: PoolState,
  amountIn: BigNumber,
  marketPrice: BigNumber,
  swapType: SwapType,
): number {
  switch (swapType) {
    case SwapType.Normal:
      return calculateOutAmountNormalSwap(
        // the market price for calculation is the reciprocal of the market price input
        new BigNumber(1).dividedBy(marketPrice),
        poolState.quoteTarget,
        poolState.baseTarget,
        poolState.quoteReserve,
        poolState.baseReserve,
        amountIn,
      );
    case SwapType.Stable:
      return calculateOutAmountStableSwap(
        new BigNumber(1).dividedBy(marketPrice),
        poolState.quoteReserve,
        poolState.baseReserve,
        amountIn,
        poolState.slope,
      );
    default:
      throw Error("Wrong swaptype: " + swapType);
  }
}

/**
 * Generates the actual amount out results from pool state and calculated amount out
 * @param currentReserveA reserve before the transaction of the input token
 * @param currentReserveB reserve before the transaction of the output token
 * @param amountIn token input amount
 * @param rawAmountOut token output amount without trade fees, calculated from the curve formula
 * @param maxSlippage max slippage limit, in percentage
 * @param fees config of the fees
 * @returns amount out information
 */
export function generateResultFromAmountOut(
  currentReserveA: BigNumber,
  currentReserveB: BigNumber,
  amountIn: number,
  rawAmountOut: number,
  maxSlippage: number,
  fees: Fees,
): {
  amountIn: number;
  amountOut: number;
  amountOutWithSlippage: number;
  fee: number;
  priceImpact: number;
} {
  const tradeFee: BigNumber = new BigNumber(rawAmountOut)
    .multipliedBy(new BigNumber(fees.tradeFeeNumerator.toString()))
    .dividedBy(fees.tradeFeeDenominator.toString());

  const amountOutWithTradeFee: BigNumber = new BigNumber(rawAmountOut).minus(tradeFee);
  const amountFromSlippage: BigNumber = amountOutWithTradeFee
    .multipliedBy(maxSlippage)
    .dividedBy(100);
  const amountOutWithTradeFeeWithSlippage: BigNumber =
    amountOutWithTradeFee.minus(amountFromSlippage);

  return {
    amountIn,
    amountOut: amountOutWithTradeFee.toNumber(),
    amountOutWithSlippage: amountOutWithTradeFeeWithSlippage.toNumber(),
    fee: tradeFee.toNumber(),
    priceImpact: calculatePriceImpact(
      currentReserveA,
      currentReserveB,
      new BigNumber(amountIn),
      new BigNumber(rawAmountOut),
      tradeFee,
      fees,
    ).toNumber(),
  };
}

/**
 * Price impact value that indicates the change from the implied price before and after the transaction
 * impliedPrice = marketPrice * (currentReserveA * targetReserveB) / (currentReserveB * targetReserveA)
 * Assuming the target reserves and the market price are not changed after this transaction
 * futureImpliedPrice / impliedPrice = (futureReserveA / futureReserveB) / (currentReserveA / currentReserveB)
 * priceImpact = abs(impliedPrice - futureImpliedPrice) / impliedPrice
 *             = (1 - (futureReserveA / futureReserveB)) / (currentReserveA / currentReserveB)
 * @param currentReserveA reserve before the transaction of the input token
 * @param currentReserveB reserve before the transaction of the output token
 * @param amountIn token input amount
 * @param rawAmountOut token output amount without trade fees, calculated from the curve formula
 * @param tradeFee trade fee of the output amount
 * @param fees config of the fees
 * @returns price impact value
 */
export function calculatePriceImpact(
  currentReserveA: BigNumber,
  currentReserveB: BigNumber,
  amountIn: BigNumber,
  rawAmountOut: BigNumber,
  tradeFee: BigNumber,
  fees: Fees,
): BigNumber {
  const adminFee: BigNumber = tradeFee
    .multipliedBy(new BigNumber(fees.adminTradeFeeNumerator.toString()))
    .dividedBy(new BigNumber(fees.adminTradeFeeDenominator.toString()));
  const futureReserveA: BigNumber = currentReserveA.plus(amountIn);
  const futureReserveB: BigNumber = currentReserveB
    .minus(rawAmountOut)
    .plus(tradeFee)
    .minus(adminFee);

  const currentRatio: BigNumber = currentReserveA.dividedBy(currentReserveB);
  const futureRatio: BigNumber = futureReserveA.dividedBy(futureReserveB);

  return futureRatio.minus(currentRatio).abs().dividedBy(currentRatio);
}
