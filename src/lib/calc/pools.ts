import { SymbolToPythPriceData } from "anchor/pyth_utils";
import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";
import { getPythMarketPrice } from "states/accounts/pythAccount";
import { SwapPoolKeyToSwap } from "states/accounts/swapAccount";
import { getTokenTvl } from "utils/utils";

export function calculateTotalHoldings(
  poolConfigs: PoolConfig[],
  swapKeyToSwapInfo: SwapPoolKeyToSwap,
  symbolToPythData: SymbolToPythPriceData,
) {
  if (poolConfigs.length > 0) {
    return (poolConfigs as any).reduce((sum, poolConfig) => {
      const swapInfo = swapKeyToSwapInfo[poolConfig.swapInfo];
      const { basePrice, quotePrice } = getPythMarketPrice(symbolToPythData, poolConfig);

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
