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
    const normalizedMaketPrice = normalizeMarketPriceWithDecimals(
      marketPriceLow,
      pool.mintBaseDecimals,
      pool.mintQuoteDecimals,
    );
    const rawAmountOut: number = getSwapOutAmountSellBase(
      pool,
      new BigNumber(amount),
      normalizedMaketPrice,
    );

    return generateResultFromAmountOut(
      new BigNumber(pool.poolState.baseReserve.toString()),
      new BigNumber(pool.poolState.quoteReserve.toString()),
      new BigNumber(pool.poolState.targetBaseReserve.toString()),
      new BigNumber(pool.poolState.targetQuoteReserve.toString()),
      parseFloat(amount),
      rawAmountOut,
      maxSlippage,
      pool.swapConfig,
      new BigNumber(normalizedMaketPrice),
    );
  } else if (
    fromToken.mint === pool.mintQuote.toBase58() &&
    toToken.mint === pool.mintBase.toBase58()
  ) {
    // sell quote case
    const normalizedMaketPrice = normalizeMarketPriceWithDecimals(
      marketPriceHigh,
      pool.mintBaseDecimals,
      pool.mintQuoteDecimals,
    );
    const rawAmountOut: number = getSwapOutAmountSellQuote(
      pool,
      new BigNumber(amount),
      normalizedMaketPrice,
    );

    return generateResultFromAmountOut(
      new BigNumber(pool.poolState.quoteReserve.toString()),
      new BigNumber(pool.poolState.baseReserve.toString()),
      new BigNumber(pool.poolState.targetQuoteReserve.toString()),
      new BigNumber(pool.poolState.targetBaseReserve.toString()),
      parseFloat(amount),
      rawAmountOut,
      maxSlippage,
      pool.swapConfig,
      new BigNumber(1).dividedBy(new BigNumber(normalizedMaketPrice)),
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
  targetReserveA: BigNumber,
  targetReserveB: BigNumber,
  amountIn: number,
  rawAmountOut: number,
  maxSlippage: number,
  swapConfig: SwapConfig,
  marketPriceInforOut: BigNumber,
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
      targetReserveA,
      targetReserveB,
      new BigNumber(amountIn),
      new BigNumber(rawAmountOut),
      marketPriceInforOut,
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
 * @param targetReserveA target reserve of token A
 * @param targetReserveB target reserve of token B
 * @param amountIn token input amount
 * @param rawAmountOut token output amount without trade fees, calculated from the curve formula
 * @param marketPriceAforB amount of B from 1 A
 * @returns price impact value
 */
export function calculatePriceImpact(
  currentReserveA: BigNumber,
  currentReserveB: BigNumber,
  targetReserveA: BigNumber,
  targetReserveB: BigNumber,
  amountIn: BigNumber,
  rawAmountOut: BigNumber,
  marketPriceAforB: BigNumber,
): BigNumber {
  const impliedPrice = marketPriceAforB
    .multipliedBy(targetReserveA)
    .multipliedBy(currentReserveB)
    .dividedBy(targetReserveB.multipliedBy(currentReserveA));
  const actualPrice = rawAmountOut.dividedBy(amountIn);

  return impliedPrice.minus(actualPrice).abs().dividedBy(impliedPrice);
}

/**
 * Market price is the price of actual base and quote token values
 * We represent token amounts in integer which is realValue * 10^decimalPlaces
 * When calculating with market price with our integer representations,
 * we need to normalize the market price with decimal places
 * @param marketPrice basePrice / quotePrice
 * @param mintBaseDecimals decimal places of base token
 * @param mintQuoteDecimals decimal places of quote token
 * @returns
 */
export function normalizeMarketPriceWithDecimals(
  marketPrice: BigNumber,
  mintBaseDecimals: number,
  mintQuoteDecimals: number,
): BigNumber {
  if (mintBaseDecimals > mintQuoteDecimals) {
    return marketPrice.dividedBy(new BigNumber(10).pow(mintBaseDecimals - mintQuoteDecimals));
  } else if (mintBaseDecimals < mintQuoteDecimals) {
    return marketPrice.multipliedBy(new BigNumber(10).pow(mintQuoteDecimals - mintBaseDecimals));
  } else {
    return marketPrice;
  }
}
