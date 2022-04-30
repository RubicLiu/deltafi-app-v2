import BigNumber from "bignumber.js";
import { PoolInfo } from "providers/types";
import { calculateOutAmountNormalSwap, calculateOutAmountStableSwap } from "lib/curve";
import { TokenConfig } from "constants/deployConfig";

export function getSwapOutAmount(
  pool: PoolInfo,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  amount: string,
  slippage: number,
  marketPrice: BigNumber,
) {
  // TODO(leqiang): use v2 formula
  const amountIn


  return {
    amountIn: parseFloat(amount),
    amountOut: parseFloat(amount),
    amountOutWithSlippage: parseFloat(amount),
    fee: 0,
    priceImpact: 0,
  };
}
