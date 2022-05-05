import BigNumber from "bignumber.js";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfigV2";
import { SwapConfig, SwapInfo } from "anchor/type_definitions";
import { WAD } from "../constants";

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
  pool: SwapInfo,
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
  if (!(marketPriceHigh && marketPriceLow) || pool.swapConfig.enableConfidenceInterval === false) {
    marketPriceHigh = marketPrice;
    marketPriceLow = marketPrice;
  }

  if (fromToken.mint === pool.mintBase.toBase58() && toToken.mint === pool.mintQuote.toBase58()) {
    // sell base case
    const rawAmountOut: number = getSwapOutAmountSellBase(
      pool,
      new BigNumber(amount),
      marketPriceLow,
    );

    return generateResultFromAmountOut(
      new BigNumber(pool.poolState.baseReserve.toString()),
      new BigNumber(pool.poolState.quoteReserve.toString()),
      parseFloat(amount),
      rawAmountOut,
      maxSlippage,
      pool.swapConfig,
    );
  } else if (
    fromToken.mint === pool.mintQuote.toBase58() &&
    toToken.mint === pool.mintBase.toBase58()
  ) {
    // sell quote case
    const rawAmountOut: number = getSwapOutAmountSellQuote(
      pool,
      new BigNumber(amount),
      marketPriceHigh,
    );

    return generateResultFromAmountOut(
      new BigNumber(pool.poolState.quoteReserve.toString()),
      new BigNumber(pool.poolState.baseReserve.toString()),
      parseFloat(amount),
      rawAmountOut,
      maxSlippage,
      pool.swapConfig,
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
      pool.mintBase.toBase58() +
      " " +
      pool.mintQuote.toBase58(),
  );
}

/**
 * Calculate out amount when selling base, reserve A is base reserve, reserve B is quote reserve
 * @param pool full swap pool information, includes the current reserve and target amounts of the tokens
 * @param amountIn base token input amount
 * @param marketPrice baseTokenPrice / quoteTokenPrice
 * @param swapType normal swap or stable swap
 * @returns quote token amount out calculated from the curve formulas
 */
export function getSwapOutAmountSellBase(
  pool: SwapInfo,
  amountIn: BigNumber,
  marketPrice: BigNumber,
): number {
  if (pool.swapType.normalSwap) {
    return calculateOutAmountNormalSwap(
      marketPrice,
      new BigNumber(pool.poolState.targetBaseReserve.toString()),
      new BigNumber(pool.poolState.targetQuoteReserve.toString()),
      new BigNumber(pool.poolState.baseReserve.toString()),
      new BigNumber(pool.poolState.quoteReserve.toString()),
      amountIn,
    );
  } else if (pool.swapType.stableSwap) {
    return calculateOutAmountStableSwap(
      marketPrice,
      new BigNumber(pool.poolState.targetBaseReserve.toString()),
      new BigNumber(pool.poolState.targetQuoteReserve.toString()),
      amountIn,
      new BigNumber(pool.swapConfig.slope.toString()).dividedBy(WAD),
    );
  } else {
    throw Error("Wrong swaptype: " + pool.swapType);
  }
}

/**
 * Calculates out amount when selling base, reserve A is quote reserve, reserve B is base reserve
 * @param pool full swap pool information, includes the current reserve and target amounts of the tokens
 * @param amountIn quote token input amount
 * @param marketPrice baseTokenPrice / quoteTokenPrice
 * @param swapType normal swap or stable swap
 * @returns base token amount out calculated from the curve formulas
 */
export function getSwapOutAmountSellQuote(
  pool: SwapInfo,
  amountIn: BigNumber,
  marketPrice: BigNumber,
): number {
  if (pool.swapType.normalSwap) {
    return calculateOutAmountNormalSwap(
      // the market price for calculation is the reciprocal of the market price input
      new BigNumber(1).dividedBy(marketPrice),
      new BigNumber(pool.poolState.targetQuoteReserve.toString()),
      new BigNumber(pool.poolState.targetBaseReserve.toString()),
      new BigNumber(pool.poolState.quoteReserve.toString()),
      new BigNumber(pool.poolState.baseReserve.toString()),
      amountIn,
    );
  } else if (pool.swapType.stableSwap) {
    return calculateOutAmountStableSwap(
      new BigNumber(1).dividedBy(marketPrice),
      new BigNumber(pool.poolState.quoteReserve.toString()),
      new BigNumber(pool.poolState.baseReserve.toString()),
      amountIn,
      new BigNumber(pool.swapConfig.slope.toString()).dividedBy(WAD),
    );
  } else {
    throw Error("Wrong swaptype: " + pool.swapType);
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
  swapConfig: SwapConfig,
): {
  amountIn: number;
  amountOut: number;
  amountOutWithSlippage: number;
  fee: number;
  priceImpact: number;
} {
  const tradeFee: BigNumber = new BigNumber(rawAmountOut)
    .multipliedBy(new BigNumber(swapConfig.tradeFeeNumerator.toString()))
    .dividedBy(swapConfig.tradeFeeDenominator.toString());

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
      swapConfig,
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
  swapConfig: SwapConfig,
): BigNumber {
  const adminFee: BigNumber = tradeFee
    .multipliedBy(new BigNumber(swapConfig.adminTradeFeeNumerator.toString()))
    .dividedBy(new BigNumber(swapConfig.adminTradeFeeDenominator.toString()));
  const futureReserveA: BigNumber = currentReserveA.plus(amountIn);
  const futureReserveB: BigNumber = currentReserveB
    .minus(rawAmountOut)
    .plus(tradeFee)
    .minus(adminFee);

  const currentRatio: BigNumber = currentReserveA.dividedBy(currentReserveB);
  const futureRatio: BigNumber = futureReserveA.dividedBy(futureReserveB);

  return futureRatio.minus(currentRatio).abs().dividedBy(currentRatio);
}
