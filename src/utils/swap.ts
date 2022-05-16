import BigNumber from "bignumber.js";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfigV2";
import { PoolState, SwapConfig, SwapInfo } from "anchor/type_definitions";
import { WAD } from "../constants";
import { exponentiate, exponentiatedBy } from "./decimal";
import { bnToString } from "./tokenUtils";
import { SWAP_DIRECTION } from "lib/instructions";

/**
 * Main interface function of this module, calculate the input information
 * of a swap with the swap output information
 * @param swapInfo pool's information, includes pool state, pool's configs of fees and all tokens and token accounts info
 * @param fromToken info of the input token
 * @param toToken info of the output token
 * @param amountOut amount of the output token to be traded
 * @param maxSlippage max maxSlippage limit, in percentage
 * @param marketPrice basePrice / quotePrice
 * @param marketPriceHigh upper bound of the market price after confidence interval adjustion
 * @param marketPriceLow lower bound of the market price after confidence interval adjustion
 * @returns amount in information (+ amount out with max slippage)
 */
export function getSwapInResult(
  swapInfo: SwapInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amountOut: string,
  maxSlippage: number,
  marketPrice: BigNumber,
  marketPriceLow?: BigNumber,
  marketPriceHigh?: BigNumber,
): {
  amountIn: string;
  amountOutWithSlippage: string;
  fee: string;
  priceImpact: string;
  sufficientReserve: boolean;
} {
  const amountOutBN: BigNumber = new BigNumber(amountOut);
  if (amountOutBN.isNaN()) {
    return {
      amountIn: "",
      amountOutWithSlippage: "",
      fee: "",
      priceImpact: "",
      sufficientReserve: true,
    };
  }
  if (amountOutBN.toNumber() < 0) {
    throw Error(`invalid amount input: ${amountOut}`);
  }

  const swapDirection: SWAP_DIRECTION = getSwapDirection(fromToken, toToken, swapInfo);

  const grossAmountOutBN: BigNumber = amountOutBN
    .multipliedBy(swapInfo.swapConfig.tradeFeeDenominator.toString())
    .dividedBy(
      swapInfo.swapConfig.tradeFeeDenominator.sub(swapInfo.swapConfig.tradeFeeNumerator).toString(),
    );

  const { amountOut: amountInNegBN, impliedPrice } = getSwappedAmountsAndImpliedPrice(
    swapInfo,
    getOppsiteSwapDirection(swapDirection), // need to use opposite swap direction
    grossAmountOutBN.negated(),
    marketPrice,
    marketPriceHigh,
    marketPriceLow,
  );

  const amountInBN: BigNumber = amountInNegBN.negated();

  const priceImpact: string = amountInBN
    .dividedBy(grossAmountOutBN)
    .minus(impliedPrice)
    .abs()
    .dividedBy(impliedPrice)
    .toString();

  const amountIn: string = parseFloat(bnToString(fromToken, amountInBN)).toString();
  const amountOutWithSlippage: string = bnToString(
    toToken,
    amountOutBN.multipliedBy(new BigNumber(100).minus(new BigNumber(maxSlippage)).dividedBy(100)),
  );

  const feeBN: BigNumber = grossAmountOutBN.minus(amountOutBN);
  const fee: string = bnToString(toToken, grossAmountOutBN.minus(amountOutBN));

  const adminFeeBN: BigNumber = feeBN
    .multipliedBy(swapInfo.swapConfig.adminTradeFeeNumerator.toString())
    .dividedBy(swapInfo.swapConfig.adminTradeFeeDenominator.toString());

  const sufficientReserve = IsSufficientReserve(
    swapDirection,
    swapInfo,
    exponentiate(amountInBN, fromToken.decimals),
    exponentiate(grossAmountOutBN.minus(adminFeeBN), toToken.decimals),
    marketPrice,
  );

  return {
    amountIn,
    amountOutWithSlippage,
    fee,
    priceImpact,
    sufficientReserve,
  };
}

/**
 * Main interface function of this module, calculate the output information
 * of a swap with the swap input information
 * @param swapInfo pool's information, includes pool state, pool's configs of fees and all tokens and token accounts info
 * @param fromToken info of the input token
 * @param toToken info of the output token
 * @param amountIn amount of the input token to be traded
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
  amountIn: string,
  maxSlippage: number,
  marketPrice: BigNumber,
  marketPriceLow?: BigNumber,
  marketPriceHigh?: BigNumber,
): {
  amountOut: string;
  amountOutWithSlippage: string;
  fee: string;
  priceImpact: string;
  sufficientReserve: boolean;
} {
  const amountInBN: BigNumber = new BigNumber(amountIn);
  if (amountInBN.isNaN()) {
    return {
      amountOut: "",
      amountOutWithSlippage: "",
      fee: "",
      priceImpact: "",
      sufficientReserve: true,
    };
  }
  if (parseFloat(amountIn) < 0) {
    throw Error(`invalid amount input: ${amountIn}`);
  }

  const swapDirection: SWAP_DIRECTION = getSwapDirection(fromToken, toToken, swapInfo);

  const { amountOut: grossAmountOutBN, impliedPrice } = getSwappedAmountsAndImpliedPrice(
    swapInfo,
    swapDirection,
    amountInBN,
    marketPrice,
    marketPriceLow,
    marketPriceHigh,
  );

  const tradeFeeBN: BigNumber = grossAmountOutBN
    .multipliedBy(swapInfo.swapConfig.tradeFeeNumerator.toString())
    .dividedBy(swapInfo.swapConfig.tradeFeeDenominator.toString());

  const amountOutAfterTradeFeeBN: BigNumber = grossAmountOutBN.minus(tradeFeeBN);

  const amountOutAfterTradeFeeWithSlippageBN: BigNumber = amountOutAfterTradeFeeBN
    .multipliedBy(100 - maxSlippage)
    .dividedBy(100);

  const priceImpact: string = grossAmountOutBN
    .dividedBy(amountInBN)
    .minus(impliedPrice)
    .abs()
    .dividedBy(impliedPrice)
    .toString();

  const amountOut: string = parseFloat(bnToString(toToken, amountOutAfterTradeFeeBN)).toString();
  const amountOutWithSlippage: string = bnToString(toToken, amountOutAfterTradeFeeWithSlippageBN);

  const fee: string = grossAmountOutBN.minus(new BigNumber(amountOut)).toString();
  const adminFeeBN: BigNumber = new BigNumber(fee)
    .multipliedBy(swapInfo.swapConfig.adminTradeFeeNumerator.toString())
    .dividedBy(swapInfo.swapConfig.adminTradeFeeDenominator.toString());

  const sufficientReserve = IsSufficientReserve(
    swapDirection,
    swapInfo,
    exponentiate(amountInBN, fromToken.decimals),
    exponentiate(grossAmountOutBN.minus(adminFeeBN), toToken.decimals),
    marketPrice,
  );

  return {
    amountOut,
    amountOutWithSlippage,
    fee,
    priceImpact,
    sufficientReserve,
  };
}

export function getSwappedAmountsAndImpliedPrice(
  swapInfo: SwapInfo,
  swapDirection: SWAP_DIRECTION,
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

  if (swapDirection === SWAP_DIRECTION.SellBase) {
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
  } else if (swapDirection === SWAP_DIRECTION.SellQuote) {
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
  throw Error("Invalid swap direction: " + swapDirection);
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

// get swapDirection from fromToken and toToken
export function getSwapDirection(
  fromToken: TokenConfig,
  toToken: TokenConfig,
  swapInfo: SwapInfo,
): SWAP_DIRECTION {
  if (
    fromToken.mint === swapInfo.mintBase.toBase58() &&
    toToken.mint === swapInfo.mintQuote.toBase58()
  ) {
    return SWAP_DIRECTION.SellBase;
  } else if (
    fromToken.mint === swapInfo.mintQuote.toBase58() &&
    toToken.mint === swapInfo.mintBase.toBase58()
  ) {
    return SWAP_DIRECTION.SellQuote;
  }

  throw Error("Invalid to/from token pair: " + fromToken.mint + " " + toToken.mint);
}

// get the opposite swap direction from the current swap direction
export function getOppsiteSwapDirection(swapDirection: SWAP_DIRECTION): SWAP_DIRECTION {
  switch (swapDirection) {
    case SWAP_DIRECTION.SellBase:
      return SWAP_DIRECTION.SellQuote;
    case SWAP_DIRECTION.SellQuote:
      return SWAP_DIRECTION.SellBase;
    default:
      throw Error("Invalid swapDirection: " + swapDirection);
  }
}

// check if there is sufficient reserves after swap with the reserve limit
export function IsSufficientReserve(
  swapDirection: SWAP_DIRECTION,
  swapInfo: SwapInfo,
  amountAddedIn: BigNumber,
  amountSubstractedOut: BigNumber,
  marketPrice: BigNumber,
): boolean {
  const targetBaseReserve = new BigNumber(swapInfo.poolState.targetBaseReserve.toString());
  const targetQuoteReserve = new BigNumber(swapInfo.poolState.targetQuoteReserve.toString());

  const { baseReserveAfter, quoteReserveAfter } = getReservesAfterSwap(
    swapInfo.poolState,
    amountAddedIn,
    amountSubstractedOut,
    swapDirection,
  );

  const { normalizedBaseReserve, normalizedQuoteReserve } = getNormalizedReserves(
    baseReserveAfter,
    quoteReserveAfter,
    targetBaseReserve,
    targetQuoteReserve,
    marketPrice,
  );

  return checkIfReserveIsSufficient(
    baseReserveAfter,
    quoteReserveAfter,
    normalizedBaseReserve,
    normalizedQuoteReserve,
    swapInfo.swapConfig,
  );
}

/**
 * Get the normalized base and quote reserve.
 * Normalized reserves are the reserve point that has same TVL of current reserve,
 * and has same base/quote ratio as the target reserves
 * normalizedBaseReserve =
 *  (currentBaseReserve * basePrice + currentQuoteReserve * quotePrice) / (targetBaseReserve * basePrice + targetQuoteReserve * quotePrice) * targetBaseReserve
 * normalizedQuoteReserve =
 *  (currentBaseReserve * basePrice + currentQuoteReserve * quotePrice) / (targetBaseReserve * basePrice + targetQuoteReserve * quotePrice) * targetQuoteReserve
 * @param baseReserve
 * @param quoteReserve
 * @param targetBaseReserve
 * @param targetQuoteReserve
 * @param marketPrice basePrice/quotePrice
 * @returns normalized base reserve and normalized quote reserve
 */
export function getNormalizedReserves(
  baseReserve: BigNumber,
  quoteReserve: BigNumber,
  targetBaseReserve: BigNumber,
  targetQuoteReserve: BigNumber,
  marketPrice: BigNumber,
): {
  normalizedBaseReserve: BigNumber;
  normalizedQuoteReserve: BigNumber;
} {
  const coefNumberator: BigNumber = baseReserve.multipliedBy(marketPrice).plus(quoteReserve);

  const coefDenumerator: BigNumber = targetBaseReserve
    .multipliedBy(marketPrice)
    .plus(targetQuoteReserve);
  const coef: BigNumber = coefNumberator.dividedBy(coefDenumerator);

  return {
    normalizedBaseReserve: coef.multipliedBy(targetBaseReserve),
    normalizedQuoteReserve: coef.multipliedBy(targetQuoteReserve),
  };
}

// get the base/quote reserves after a swap,
// with amount to be added in and the amount to be substracted out
export function getReservesAfterSwap(
  poolState: PoolState,
  amountAddedIn: BigNumber,
  amountSubstractedOut: BigNumber,
  swapDirection: SWAP_DIRECTION,
): {
  baseReserveAfter: BigNumber;
  quoteReserveAfter: BigNumber;
} {
  const baseReserve: BigNumber = new BigNumber(poolState.baseReserve.toString());
  const quoteReserve: BigNumber = new BigNumber(poolState.quoteReserve.toString());

  switch (swapDirection) {
    case SWAP_DIRECTION.SellBase:
      return {
        baseReserveAfter: baseReserve.plus(amountAddedIn),
        quoteReserveAfter: quoteReserve.minus(amountSubstractedOut),
      };

    case SWAP_DIRECTION.SellQuote:
      return {
        baseReserveAfter: baseReserve.minus(amountSubstractedOut),
        quoteReserveAfter: quoteReserve.plus(amountAddedIn),
      };

    default:
      throw Error("Invalid swapDirection: " + swapDirection);
  }
}

// giving base/quote reserves and normalized base/quote reserves
// check if they satisfies the reserve limit
export function checkIfReserveIsSufficient(
  baseReserve: BigNumber,
  quoteReserve: BigNumber,
  normalizedBaseReserve: BigNumber,
  normalizedQuoteReserve: BigNumber,
  swapConfig: SwapConfig,
): boolean {
  return (
    baseReserve.gt(
      normalizedBaseReserve.multipliedBy(swapConfig.minReserveLimitPercentage).dividedBy(100),
    ) &&
    quoteReserve.gt(
      normalizedQuoteReserve.multipliedBy(swapConfig.minReserveLimitPercentage).dividedBy(100),
    )
  );
}
