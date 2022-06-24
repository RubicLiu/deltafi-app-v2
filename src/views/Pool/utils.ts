import { SwapInfo } from "anchor/type_definitions";
import BigNumber from "bignumber.js";
import { TokenConfig } from "constants/deployConfigV2";
import { getTokenTvl } from "utils/utils";

export function calculatePoolTvl(
  basePrice: number | BigNumber | string,
  quotePrice: number | BigNumber | string,
  baseTokenInfo: TokenConfig,
  quoteTokenInfo: TokenConfig,
  swapInfo: SwapInfo,
) {
  if (basePrice && quotePrice && swapInfo) {
    basePrice = new BigNumber(basePrice);
    quotePrice = new BigNumber(quotePrice);
    const baseTvl = getTokenTvl(baseTokenInfo, swapInfo.poolState.baseReserve, basePrice);
    const quoteTvl = getTokenTvl(quoteTokenInfo, swapInfo.poolState.quoteReserve, quotePrice);
    const tvl = baseTvl.plus(quoteTvl);
    return {
      baseTvl,
      quoteTvl,
      tvl,
    };
  }
  return {
    baseTvl: new BigNumber(null),
    quoteTvl: new BigNumber(null),
    tvl: new BigNumber(null),
  };
}
