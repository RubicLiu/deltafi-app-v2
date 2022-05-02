import BigNumber from "bignumber.js";
import { PoolInfo } from "providers/types";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfig";
import { SWAP_DIRECTION } from "lib/instructions";
import { PoolState, SwapType } from "lib/state";

export function getSwapOutAmount(
  pool: PoolInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amount: string,
  slippage: number,
  marketPrice: BigNumber,
) {
  // TODO(leqiang): use v2 formula
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
        amountIn
      );
  }
}

