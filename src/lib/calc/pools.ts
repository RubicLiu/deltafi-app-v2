import { SymbolToPythPriceData } from "anchor/pyth_utils";
import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";
import { getPythMarketPrice } from "states/accounts/pythAccount";
import { SwapPoolKeyToSwap } from "states/accounts/swapAccount";
import { getTokenTvl } from "utils/utils";

export function calculateTotalValueLocked(
  poolConfigs: PoolConfig[],
  swapKeyToSwapInfo: SwapPoolKeyToSwap,
  symbolToPythPriceData: SymbolToPythPriceData,
) {
  if (poolConfigs.length > 0) {
    if (Object.keys(swapKeyToSwapInfo).length < poolConfigs.length) {
      // if the swapinfo length is less than pool config length, it means the data is not loaded yet
      return new BigNumber(null);
    }
    return (poolConfigs as any).reduce((sum, poolConfig) => {
      const swapInfo = swapKeyToSwapInfo[poolConfig.swapInfo];
      const { basePrice, quotePrice } = getPythMarketPrice(symbolToPythPriceData, poolConfig);

      let volumn = new BigNumber(0);
      if (basePrice && quotePrice && swapInfo) {
        const baseTvl = getTokenTvl(
          poolConfig.baseTokenInfo,
          swapInfo.poolState.baseReserve,
          basePrice,
        );
        const quoteTvl = getTokenTvl(
          poolConfig.quoteTokenInfo,
          swapInfo.poolState.quoteReserve,
          quotePrice,
        );
        volumn = baseTvl.plus(quoteTvl);
      }
      return sum.plus(volumn);
    }, new BigNumber(0)) as BigNumber;
  }
  return new BigNumber(0);
}
