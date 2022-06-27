import { PoolState } from "anchor/type_definitions";
import BigNumber from "bignumber.js";
import BN from "bn.js";
import { TokenConfig } from "constants/deployConfigV2";
import { anchorBnToBn, stringCutTokenDecimals } from "utils/tokenUtils";

export function calculateWithdrawalFromShares(
  baseShare: BN,
  quoteShare: BN,
  baseTokenConfig: TokenConfig,
  quoteTokenConfig: TokenConfig,
  basePrice: BigNumber,
  quotePrice: BigNumber,
  poolState: PoolState,
): {
  baseWithdrawalAmount: string;
  quoteWithdrawalAmount: string;
} {
  let baseWithdrawalAmount: BigNumber;
  let quoteWithdrawalAmount: BigNumber;

  const baseTokenInfo: tokenShareInfo = {
    price: basePrice,
    share: anchorBnToBn(baseTokenConfig, baseShare),
    shareSupply: anchorBnToBn(baseTokenConfig, poolState.baseSupply),
    reserve: anchorBnToBn(baseTokenConfig, poolState.baseReserve),
    targetReserve: anchorBnToBn(baseTokenConfig, poolState.targetBaseReserve),
  };

  const quoteTokenInfo: tokenShareInfo = {
    price: quotePrice,
    share: anchorBnToBn(quoteTokenConfig, quoteShare),
    shareSupply: anchorBnToBn(quoteTokenConfig, poolState.quoteSupply),
    reserve: anchorBnToBn(quoteTokenConfig, poolState.quoteReserve),
    targetReserve: anchorBnToBn(quoteTokenConfig, poolState.targetQuoteReserve),
  };

  const baseReserveToTargetRatio: BigNumber = baseTokenInfo.reserve.dividedBy(
    baseTokenInfo.targetReserve,
  );
  const quoteReserveToTargetRatio: BigNumber = quoteTokenInfo.reserve.dividedBy(
    quoteTokenInfo.targetReserve,
  );

  if (baseReserveToTargetRatio.isLessThan(quoteReserveToTargetRatio)) {
    const { lowTokenAmount, highTokenAmount } = calculateWithdrawFromSharesAndBalances(
      baseTokenInfo,
      quoteTokenInfo,
    );
    baseWithdrawalAmount = lowTokenAmount;
    quoteWithdrawalAmount = highTokenAmount;
  } else {
    const { lowTokenAmount, highTokenAmount } = calculateWithdrawFromSharesAndBalances(
      quoteTokenInfo,
      baseTokenInfo,
    );
    baseWithdrawalAmount = highTokenAmount;
    quoteWithdrawalAmount = lowTokenAmount;
  }

  return {
    baseWithdrawalAmount: stringCutTokenDecimals(
      baseTokenConfig,
      baseWithdrawalAmount.toFixed(baseTokenConfig.decimals),
    ),
    quoteWithdrawalAmount: stringCutTokenDecimals(
      quoteTokenConfig,
      quoteWithdrawalAmount.toFixed(quoteTokenConfig.decimals),
    ),
  };
}

interface tokenShareInfo {
  price: BigNumber;
  share: BigNumber;
  shareSupply: BigNumber;
  reserve: BigNumber;
  targetReserve: BigNumber;
}

export function calculateWithdrawFromSharesAndBalances(
  lowTokenShareInfo: tokenShareInfo,
  highTokenShareInfo: tokenShareInfo,
): {
  lowTokenAmount: BigNumber;
  highTokenAmount: BigNumber;
} {
  const lowTokenAmount: BigNumber = lowTokenShareInfo.reserve
    .multipliedBy(lowTokenShareInfo.share)
    .dividedBy(lowTokenShareInfo.shareSupply);

  const highTokenReserveBase: BigNumber = lowTokenShareInfo.reserve
    .multipliedBy(highTokenShareInfo.targetReserve)
    .dividedBy(lowTokenShareInfo.targetReserve);
  const highTokenAmountBase: BigNumber = highTokenReserveBase
    .multipliedBy(highTokenShareInfo.share)
    .dividedBy(highTokenShareInfo.shareSupply);
  const shareTvlRatio = lowTokenShareInfo.share
    .multipliedBy(lowTokenShareInfo.price)
    .plus(highTokenShareInfo.share.multipliedBy(highTokenShareInfo.price))
    .dividedBy(
      lowTokenShareInfo.shareSupply
        .multipliedBy(lowTokenShareInfo.price)
        .plus(highTokenShareInfo.shareSupply.multipliedBy(highTokenShareInfo.price)),
    );

  const highTokenAmountResidual: BigNumber = highTokenShareInfo.reserve
    .minus(highTokenReserveBase)
    .multipliedBy(shareTvlRatio);

  return {
    lowTokenAmount,
    highTokenAmount: highTokenAmountBase.plus(highTokenAmountResidual),
  };
}
