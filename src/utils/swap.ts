import BigNumber from "bignumber.js";
import { PoolInfo } from "providers/types";
import { calculateOutAmountNormalSwap,  } from "lib/curve";

export function getSwapOutAmount(
  pool: PoolInfo,
  fromTokenMint: string,
  toTokenMint: string,
  amount: string,
  slippage: number,
  marketPrice: BigNumber,
) {
  // TODO(leqiang): use v2 formula
  return {
    amountIn: parseFloat(amount),
    amountOut: parseFloat(amount),
    amountOutWithSlippage: parseFloat(amount),
    fee: 0,
    priceImpact: 0,
  };
}
