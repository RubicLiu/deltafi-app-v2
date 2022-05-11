import BigNumber from "bignumber.js";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfigV2";
import { SwapInfo } from "anchor/type_definitions";
import { WAD } from "../constants";
import { exponentiate, exponentiatedBy } from "./decimal";
import { bnToString } from "./tokenUtils";

export function getSwapInResult(
  swapInfo: SwapInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amount: string,
  maxSlippage: number,
  marketPrice: BigNumber,
  marketPriceLow?: BigNumber,
  marketPriceHigh?: BigNumber,
): {
  amountIn: string;
  amountOutWithSlippage: string;
  fee: string;
  priceImpact: string;
} {
  if (new BigNumber(amount).isNaN()) {
    return {
      amountIn: "",
      amountOutWithSlippage: "",
      fee: "",
      priceImpact: "",
    };
  }
  if (parseFloat(amount) < 0) {
    throw Error(`invalid amount input: ${amount}`);
  }

  const grossAmountOut: BigNumber = new BigNumber(amount)
    .multipliedBy(swapInfo.swapConfig.tradeRewardDenominator.toString())
    .dividedBy(
      swapInfo.swapConfig.tradeRewardDenominator
        .sub(swapInfo.swapConfig.tradeFeeNumerator)
        .toString(),
    );

  const { amountOut: amountInNeg, impliedPrice } = getSwappedAmountsAndImpliedPrice(
    swapInfo,
    fromToken,
    toToken,
    grossAmountOut.negated(),
    marketPrice,
    marketPriceLow,
    marketPriceHigh,
  );

  const priceImpact: BigNumber = amountInNeg
    .dividedBy(grossAmountOut.negated())
    .minus(impliedPrice)
    .abs()
    .dividedBy(impliedPrice);

  const amountIn: string = parseFloat(bnToString(fromToken, amountInNeg.negated())).toString();
}

/**
 * Main interface function of this module, calculate the output information
 * of a swap with the swap input information
 * @param swapInfo pool's information, includes pool state, pool's configs of fees and all tokens and token accounts info
 * @param fromToken info of the input token
 * @param toToken info of the output token
 * @param amount amount of the input token to be traded
 * @param maxSlippage max maxSlippage limit, in percentage
 * @param marketPrice basePrice / quotePrice
 * @param marketPriceHigh upper bound of the market price after confidence interval adjustion
 * @param marketPriceLow lower bound of the market price after confidence interval adjustion
 * @returns amount out information
 */
export function getSwapOutResult(
  swapInfo: SwapInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amount: string,
  maxSlippage: number,
  marketPrice: BigNumber,
  marketPriceLow?: BigNumber,
  marketPriceHigh?: BigNumber,
): {
  amountOut: string;
  amountOutWithSlippage: string;
  fee: string;
  priceImpact: string;
} {
  const amountIn: BigNumber = new BigNumber(amount);
  if (amountIn.isNaN()) {
    return {
      amountOut: "",
      amountOutWithSlippage: "",
      fee: "",
      priceImpact: "",
    };
  }
  if (parseFloat(amount) < 0) {
    throw Error(`invalid amount input: ${amount}`);
  }

  const { amountOut: grossAmountOut, impliedPrice } = getSwappedAmountsAndImpliedPrice(
    swapInfo,
    fromToken,
    toToken,
    amountIn,
    marketPrice,
    marketPriceLow,
    marketPriceHigh,
  );

  const tradeFee: BigNumber = grossAmountOut
    .multipliedBy(swapInfo.swapConfig.tradeFeeNumerator.toString())
    .dividedBy(swapInfo.swapConfig.tradeFeeDenominator.toString());

  const amountOutAfterTradeFee: BigNumber = grossAmountOut.minus(tradeFee);

  const amountOutAfterTradeFeeWithSlippage: BigNumber = amountOutAfterTradeFee
    .multipliedBy(100 - maxSlippage)
    .dividedBy(100);

  const priceImpact: BigNumber = grossAmountOut
    .dividedBy(amountIn)
    .minus(impliedPrice)
    .abs()
    .dividedBy(impliedPrice);

  const amountOut: string = parseFloat(bnToString(toToken, amountOutAfterTradeFee)).toString();
  const amountOutWithSlippage: string = bnToString(toToken, amountOutAfterTradeFeeWithSlippage);

  const fee: string = new BigNumber(amountOut)
    .minus(new BigNumber(amountOutWithSlippage))
    .toString();
  return {
    amountOut,
    amountOutWithSlippage,
    fee,
    priceImpact: priceImpact.toString(),
  };
}

export function getSwappedAmountsAndImpliedPrice(
  swapInfo: SwapInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amountIn: BigNumber,
  marketPrice: BigNumber,
  marketPriceSellBase?: BigNumber,
  marketPriceSellQuote?: BigNumber,
): {
  amountIn: BigNumber;
  amountOut: BigNumber;
  impliedPrice: BigNumber;
} {
  if (
    !(marketPriceSellBase && marketPriceSellQuote) ||
    swapInfo.swapConfig.enableConfidenceInterval === false
  ) {
    marketPriceSellBase = marketPrice;
    marketPriceSellQuote = marketPrice;
  }

  if (
    fromToken.mint === swapInfo.mintBase.toBase58() &&
    toToken.mint === swapInfo.mintQuote.toBase58()
  ) {
    // sell base case
    const rawAmountIn: BigNumber = exponentiate(amountIn, swapInfo.mintBaseDecimals);
    const normalizedMaketPrice = normalizeMarketPriceWithDecimals(
      marketPriceSellBase,
      swapInfo.mintBaseDecimals,
      swapInfo.mintQuoteDecimals,
    );
    const rawAmountOut: BigNumber = new BigNumber(
      getSwapOutAmountSellBase(swapInfo, rawAmountIn, normalizedMaketPrice),
    );

    const impliedPrice = marketPriceSellBase
      .multipliedBy(swapInfo.poolState.targetBaseReserve.toString())
      .multipliedBy(swapInfo.poolState.quoteReserve.toString())
      .dividedBy(swapInfo.poolState.targetQuoteReserve.toString())
      .dividedBy(swapInfo.poolState.baseReserve.toString());

    return {
      amountIn,
      amountOut: exponentiatedBy(rawAmountOut, swapInfo.mintQuoteDecimals),
      impliedPrice,
    };
  } else if (
    fromToken.mint === swapInfo.mintQuote.toBase58() &&
    toToken.mint === swapInfo.mintBase.toBase58()
  ) {
    // sell quote case
    const rawAmountIn: BigNumber = exponentiate(amountIn, swapInfo.mintQuoteDecimals);
    const normalizedMaketPrice = normalizeMarketPriceWithDecimals(
      marketPriceSellQuote,
      swapInfo.mintBaseDecimals,
      swapInfo.mintQuoteDecimals,
    );
    const rawAmountOut: BigNumber = new BigNumber(
      getSwapOutAmountSellQuote(swapInfo, rawAmountIn, normalizedMaketPrice),
    );

    const impliedPrice = new BigNumber(1).dividedBy(
      marketPriceSellQuote
        .multipliedBy(swapInfo.poolState.targetBaseReserve.toString())
        .multipliedBy(swapInfo.poolState.quoteReserve.toString())
        .dividedBy(swapInfo.poolState.targetQuoteReserve.toString())
        .dividedBy(swapInfo.poolState.baseReserve.toString()),
    );

    return {
      amountIn,
      amountOut: exponentiatedBy(rawAmountOut, swapInfo.mintBaseDecimals),
      impliedPrice,
    };
  }

  // if the above if - else-if condition is not satisfied
  // the input from/to mint addresses do not match the pool's base and quote mint address
  throw Error(
    "Wrong to and from token mint: " +
      toToken.mint +
      " " +
      fromToken.mint +
      ", pool's base and quote tokens are: " +
      swapInfo.mintBase.toBase58() +
      " " +
      swapInfo.mintQuote.toBase58(),
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
      new BigNumber(pool.poolState.marketPrice.toString()).dividedBy(WAD),
      new BigNumber(pool.poolState.baseReserve.toString()),
      new BigNumber(pool.poolState.quoteReserve.toString()),
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
      new BigNumber(1).dividedBy(
        new BigNumber(pool.poolState.marketPrice.toString()).dividedBy(WAD),
      ),
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
    return exponentiatedBy(marketPrice, mintBaseDecimals - mintQuoteDecimals);
  } else if (mintBaseDecimals < mintQuoteDecimals) {
    return exponentiate(marketPrice, mintQuoteDecimals - mintBaseDecimals);
  } else {
    return marketPrice;
  }
}
