import { SymbolToPythPriceData } from "anchor/pyth_utils";
import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";
import { FarmPoolKeyToFarm } from "states/accounts/farmAccount";
import { FarmPoolKeyToFarmUser } from "states/accounts/farmUserAccount";
import { getPythPrice } from "states/accounts/pythAccount";
import { SwapPoolKeyToSwap } from "states/accounts/swapAccount";
import { anchorBnToBn } from "utils/tokenUtils";
import { getTokenShareTvl, getTokenTvl } from "utils/utils";

export type FarmInfoData = {
  farmInfoAddress: string;
  totalStaked: BigNumber;
  userStaked: BigNumber;
  apr: BigNumber;
  poolConfig: PoolConfig;
};

export function calculateFarmPoolsStakeInfo(
  poolConfigs: PoolConfig[],
  swapKeyToSwapInfo: SwapPoolKeyToSwap,
  symbolToPythPriceData: SymbolToPythPriceData,
  deltafiPrice: any,
  farmKeyToFarmInfo: FarmPoolKeyToFarm,
  farmPoolKeyToFarmUser?: FarmPoolKeyToFarmUser,
): FarmInfoData[] {
  const result = [];

  poolConfigs.forEach((poolConfig) => {
    const swapInfo = swapKeyToSwapInfo[poolConfig.swapInfo];
    poolConfig?.farmInfoList?.forEach(({ farmInfo: farmInfoAddress }) => {
      const farmInfo = farmKeyToFarmInfo[farmInfoAddress];
      // null means there is no farmuser supplied explicitly
      // undefined means it is not loaded for some reason
      const farmUser = farmPoolKeyToFarmUser ? farmPoolKeyToFarmUser[farmInfoAddress] : null;
      const basePrice = getPythPrice(symbolToPythPriceData, poolConfig.base);
      const quotePrice = getPythPrice(symbolToPythPriceData, poolConfig.quote);

      if (
        !basePrice?.price ||
        !quotePrice?.price ||
        !swapInfo?.poolState ||
        !farmInfo ||
        farmUser === undefined ||
        !deltafiPrice?.last
      ) {
        // if any of the data is not available, we push nan data
        // null and undefined values have different meaning to farmUser, null means there is no farmUser undefined means the data is not fetched
        result.push({
          farmInfoAddress,
          totalStaked: new BigNumber(null),
          userStaked: new BigNumber(null),
          apr: new BigNumber(null),
          poolConfig,
        });
        return;
      }

      const baseTvl = getTokenTvl(
        poolConfig.baseTokenInfo,
        swapInfo.poolState?.baseReserve,
        new BigNumber(basePrice.price),
      );
      const quoteTvl = getTokenTvl(
        poolConfig.quoteTokenInfo,
        swapInfo.poolState?.quoteReserve,
        new BigNumber(quotePrice.price),
      );

      // calculate total staked amount
      const baseStakedTvl = getTokenShareTvl(
        baseTvl,
        farmInfo?.stakedBaseShare,
        swapInfo.poolState?.baseSupply,
      );
      const quoteStakedTvl = getTokenShareTvl(
        quoteTvl,
        farmInfo?.stakedQuoteShare,
        swapInfo.poolState?.quoteSupply,
      );
      const totalStaked = baseStakedTvl.plus(quoteStakedTvl);

      // calculate staked amount by the user
      const { userBaseStakedTvl, userQuoteStakedTvl } =
        farmUser === null
          ? {
              userBaseStakedTvl: new BigNumber(0),
              userQuoteStakedTvl: new BigNumber(0),
            }
          : {
              userBaseStakedTvl: getTokenShareTvl(
                baseTvl,
                farmUser.basePosition?.depositedAmount,
                swapInfo.poolState?.baseSupply,
              ),
              userQuoteStakedTvl: getTokenShareTvl(
                quoteTvl,
                farmUser.quotePosition?.depositedAmount,
                swapInfo.poolState?.quoteSupply,
              ),
            };

      const userStaked = userBaseStakedTvl.plus(userQuoteStakedTvl);

      // calculate apr
      // reward from base per year if we have all the base share supply
      const baseRewardRateAllShare = anchorBnToBn(
        poolConfig.baseTokenInfo,
        swapInfo.poolState.baseSupply,
      )
        .multipliedBy(farmInfo.farmConfig.baseAprNumerator.toString())
        .dividedBy(farmInfo.farmConfig.baseAprDenominator.toString())
        .multipliedBy(deltafiPrice.last);

      // reward from quote per year if we have all the quote share supply
      const quoteRewardRateAllShare = anchorBnToBn(
        poolConfig.quoteTokenInfo,
        swapInfo.poolState.quoteSupply,
      )
        .multipliedBy(farmInfo.farmConfig?.quoteAprNumerator.toString())
        .dividedBy(farmInfo.farmConfig?.quoteAprDenominator.toString())
        .multipliedBy(deltafiPrice.last);

      const apr = baseRewardRateAllShare
        .plus(quoteRewardRateAllShare)
        .dividedBy(baseTvl.plus(quoteTvl))
        .multipliedBy(100);

      result.push({ farmInfoAddress, totalStaked, userStaked, apr, poolConfig });
    });
  });

  return result;
}
