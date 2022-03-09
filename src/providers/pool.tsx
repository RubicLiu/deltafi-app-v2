import { AccountInfo } from "@solana/web3.js";

import { PoolInfo } from "./types";
import { parseSwapInfo } from "lib/state";
import { getTokenInfo } from "./tokens";

export const getPoolFromSwapInfoAccount = (schema, publicKey, poolInfo) => {
  const { data } = parseSwapInfo(poolInfo as AccountInfo<Buffer>);
  return {
    name: schema.name,
    swapType: data.swapType,
    publicKey: publicKey,
    nonce: data.nonce,
    isPaused: data.isPaused,
    baseTokenInfo: getTokenInfo(schema.base),
    quoteTokenInfo: getTokenInfo(schema.quote),
    base: data.tokenA,
    quote: data.tokenB,
    pythBase: data.pythA,
    pythQuote: data.pythB,
    poolMintKey: data.poolMint,
    baseFee: data.adminFeeKeyA,
    quoteFee: data.adminFeeKeyB,
    fees: data.fees,
    rewards: data.rewards,
    poolState: data.poolState,
    schema: schema,
  };
};

export function getPoolBySymbols(pools: PoolInfo[], base?: string, quote?: string) {
  if (pools.length > 0 && base && quote) {
    return pools.find(
      (s) =>
        (s.baseTokenInfo.symbol.toLowerCase() === base.toLowerCase() &&
          s.quoteTokenInfo.symbol.toLowerCase() === quote.toLowerCase()) ||
        (s.baseTokenInfo.symbol.toLowerCase() === quote.toLowerCase() &&
          s.quoteTokenInfo.symbol.toLowerCase() === base.toLowerCase()),
    );
  }
  return null;
}
