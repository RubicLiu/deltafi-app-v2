import BigNumber from "bignumber.js";
import { PoolInfo } from "providers/types";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfig";
import { SWAP_DIRECTION } from "lib/instructions";
import { Fees, PoolState, SwapType } from "lib/state";

export function getSwapOutAmount(
  pool: PoolInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amount: string,
  slippage: number,
  marketPrice: BigNumber,
  marketPriceHigh?: BigNumber,
  marketPriceLow?: BigNumber,
) {
  // TODO(leqiang): use v2 formula
  if (!(marketPriceHigh && marketPriceLow) || pool.enableConfidenceInterval === false) {
    marketPriceHigh = marketPrice;
    marketPriceLow = marketPrice;
  }

  const amountIn: number = parseFloat(amount);
  let swapDirection = null;
  if (fromToken.mint === pool.base.toBase58() && toToken.mint === pool.quote.toBase58()) {
    swapDirection = SWAP_DIRECTION.SellBase;
  } else if (fromToken.mint === pool.quote.toBase58() && toToken.mint === pool.base.toBase58()) {
    swapDirection = SWAP_DIRECTION.SellQuote;
  } else {
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

  return {
    amountIn: parseFloat(amount),
    amountOut: parseFloat(amount),
    amountOutWithSlippage: parseFloat(amount),
    fee: 0,
    priceImpact: 0,
  };
}

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

export function getSwapOutAmountSellQuote(
  poolState: PoolState,
  amountIn: BigNumber,
  marketPrice: BigNumber,
  swapType: SwapType,
): number {
  switch (swapType) {
    case SwapType.Normal:
      return calculateOutAmountNormalSwap(
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

export function generateResultFromAmountOut(
  currentReserveA: BigNumber,
  currentReserveB: BigNumber,
  amountIn: number,
  rawAmountOut: number,
  slippage: number,
  fees: Fees,
): {
  amountIn: number;
  amountOut: number;
  amountOutWithSlippage: number;
  fee: number;
  price_impact: number;
} {
  const tradeFee: BigNumber = new BigNumber(rawAmountOut)
    .multipliedBy(new BigNumber(fees.tradeFeeNumerator.toString()))
    .dividedBy(fees.tradeFeeDenominator.toString());

  const amountOutWithTradeFee: BigNumber = new BigNumber(rawAmountOut).minus(tradeFee);
  const amountFromSlippage: BigNumber = amountOutWithTradeFee.multipliedBy(slippage).dividedBy(100);
  const amountOutWithTradeFeeWithSlippage: BigNumber =
    amountOutWithTradeFee.minus(amountFromSlippage);

  return {
    amountIn,
    amountOut: amountOutWithTradeFee.toNumber(),
    amountOutWithSlippage: amountOutWithTradeFeeWithSlippage.toNumber(),
    fee: tradeFee.toNumber(),
    price_impact: calculatePriceImpact(
      currentReserveA,
      currentReserveB,
      new BigNumber(amountIn),
      new BigNumber(rawAmountOut),
      tradeFee,
      fees,
    ).toNumber(),
  };
}

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
  const futureReserveB: BigNumber = currentReserveB.minus(rawAmountOut).plus(tradeFee).minus(adminFee);

  const currentRatio: BigNumber = currentReserveA.dividedBy(currentReserveB);
  const futureRatio: BigNumber = futureReserveA.dividedBy(futureReserveB);

  return futureRatio.minus(currentRatio).abs().dividedBy(currentRatio);
}
