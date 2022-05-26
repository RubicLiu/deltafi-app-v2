import { PoolState } from "anchor/type_definitions";
import BigNumber from "bignumber.js";
import BN from "bn.js";
import { TokenConfig } from "constants/deployConfigV2";
import { bnToString } from "utils/tokenUtils";

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

  let rawBaseWithdrawalAmount: BigNumber;
  let rawQuoteWithdrawalAmount: BigNumber;

  const baseTokenInfo: tokenShareInfo = {
    price: basePrice,
    share: new BigNumber(baseShare.toString()),
    shareSupply: new BigNumber(poolState.baseSupply.toString()),
    reserve: new BigNumber(poolState.baseReserve.toString()),
    targetReserve: new BigNumber(poolState.targetBaseReserve.toString()),
  };

  const quoteTokenInfo: tokenShareInfo = {
    price: quotePrice,
    share: new BigNumber(quoteShare.toString()),
    shareSupply: new BigNumber(poolState.quoteSupply.toString()),
    reserve: new BigNumber(poolState.quoteReserve.toString()),
    targetReserve: new BigNumber(poolState.targetQuoteReserve.toString())
  };

  const baseReserveToTargetRatio: BigNumber = new BigNumber(
    poolState.baseReserve.toString(),
  ).dividedBy(poolState.targetBaseReserve.toString());
  const quoteReserveToTargetRatio: BigNumber = new BigNumber(
    poolState.quoteReserve.toString(),
  ).dividedBy(poolState.targetBaseReserve.toString());
  
  if (baseReserveToTargetRatio.isLessThan(quoteReserveToTargetRatio)) {
    const {rawLowTokenAmount: rawBaseWithdrawalAmount, rawHighTokenAmount: rawQuoteWithdrawalAmount} = calculateWithdrawFromSharesAndBalances(
      baseTokenInfo,
      quoteTokenInfo,
    )
  }
  else {
    const {rawLowTokenAmount: rawQuoteWithdrawalAmount, rawHighTokenAmount: rawBaseWithdrawalAmount} = calculateWithdrawFromSharesAndBalances(
      quoteTokenInfo,
      baseTokenInfo,
    )
  }

  return {
    baseWithdrawalAmount: bnToString(baseTokenConfig, rawBaseWithdrawalAmount),
    quoteWithdrawalAmount: bnToString(quoteTokenConfig, rawQuoteWithdrawalAmount),
  }

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
  rawLowTokenAmount: BigNumber;
  rawHighTokenAmount: BigNumber;
} {
  const rawLowTokenAmount: BigNumber = lowTokenShareInfo.reserve
    .multipliedBy(lowTokenShareInfo.share)
    .dividedBy(lowTokenShareInfo.shareSupply);
  const highTokenReserveBase: BigNumber = lowTokenShareInfo.reserve
    .multipliedBy(highTokenShareInfo.price)
    .dividedBy(lowTokenShareInfo.price);
  const rawHighTokenAmountBase: BigNumber = highTokenReserveBase
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

  const rawHighTokenAmountResidual: BigNumber = highTokenShareInfo.reserve
    .minus(highTokenReserveBase)
    .multipliedBy(shareTvlRatio);

  return {
    rawLowTokenAmount,
    rawHighTokenAmount: rawHighTokenAmountBase.plus(rawHighTokenAmountResidual),
  };
}
