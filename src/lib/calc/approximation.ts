import assert from "assert";
import BigNumber from "bignumber.js";
import { BigNumberWithConfig } from "./utils";

/// See "Approximation Method" in deltafi-dex-v2/contracts/programs/deltafi-dex-v2/src/curve/README.md
/// this function gets k = k_1*k_2 first
/// for simpler comments, let
/// - a = currentReserveA
/// - b = currentReserveB
/// - A = targetReserveA
/// - B = targetReserveB
/// - P = marketPrice
/// - m = inputAAmount
/// the return value is a tuple with 2 number value:
/// - impliedOutAmount: the amount in u64 using implied price
/// - approximationResult: the amount of using this approximation
export function approximateOutAmount(
  currentReserveA: BigNumber,
  currentReserveB: BigNumber,
  targetReserveA: BigNumber,
  targetReserveB: BigNumber,
  marketPrice: BigNumber,
  inputAAmount: BigNumber,
): {
  impliedOutAmount: number;
  approximationResult: number;
} {
  let exp_ceil: number = Math.ceil(
    marketPrice.multipliedBy(targetReserveA).dividedBy(targetReserveB).toNumber(),
  );

  assert(exp_ceil < (1 << 8) - 1);

  const impliedOutAmountNumerator: BigNumber = currentReserveB
    .multipliedBy(inputAAmount)
    .multipliedBy(marketPrice)
    .multipliedBy(targetReserveA);

  const impliedOutAmountDenumerator: BigNumber = targetReserveB.multipliedBy(currentReserveA);
  const impliedOutAmountBigNumber: BigNumber = impliedOutAmountNumerator.dividedBy(
    impliedOutAmountDenumerator,
  );

  if (
    currentReserveA.isLessThanOrEqualTo(inputAAmount.multipliedBy(exp_ceil)) ||
    currentReserveB.isLessThanOrEqualTo(inputAAmount)
  ) {
    return {
      impliedOutAmount: Math.floor(impliedOutAmountBigNumber.toNumber()),
      approximationResult: 0,
    };
  }

  const kProduct: BigNumber = approximateUpperBoundK(currentReserveA, inputAAmount, exp_ceil);
  const kMultiplier: BigNumber = kProduct.minus(new BigNumber(1));
  const kMultiplicand: BigNumber = currentReserveB.minus(impliedOutAmountBigNumber);

  const diffFromImpliedAmount: BigNumber = kMultiplier.multipliedBy(kMultiplicand);
  if (impliedOutAmountBigNumber.isLessThanOrEqualTo(diffFromImpliedAmount)) {
    return {
      impliedOutAmount: Math.floor(impliedOutAmountBigNumber.toNumber()),
      approximationResult: 0,
    };
  }

  const approximationResult: number = Math.floor(
    impliedOutAmountBigNumber.minus(diffFromImpliedAmount).toNumber(),
  );
  const impliedOutAmount: number = Math.floor(impliedOutAmountBigNumber.toNumber());
  assert(approximationResult <= impliedOutAmount);

  return { impliedOutAmount, approximationResult };
}

/**
 * Approximate an upper bound of k
 * - (a/(a + m))^(P*A/B) = k_1*(1 - m/a)^(P*A/B)
 * - (1 - m/a)^(P*A/B) = k_2*(1 - (m/a)*(P*A/B))
 * - k = k_1*k_2
 * - core_high = (a/(a + m))^(P*A/B)
 * - core_low = (1 - (m/a)*(P*A/B))
 * - k = core_high/core_low
 */
export function approximateUpperBoundK(
  currentReserveA: BigNumber,
  inputAAmount: BigNumber,
  exp_ceil: number,
): BigNumber {
  // we need to ceil the coreHigh which is the numerator of the result
  let coreHigh: BigNumber = BigNumberWithConfig(currentReserveA, {
    ROUNDING_MODE: BigNumber.ROUND_CEIL,
  })
    .dividedBy(currentReserveA.plus(inputAAmount))
    .exponentiatedBy(exp_ceil);

  // we need to floor the coreLow which is the denumerator of the result
  let coreLow: BigNumber = BigNumberWithConfig(
    currentReserveA.minus(inputAAmount.multipliedBy(exp_ceil)),
    {
      ROUNDING_MODE: BigNumber.ROUND_FLOOR,
    },
  ).dividedBy(currentReserveA);

  return BigNumberWithConfig(coreHigh, {
    ROUNDING_MODE: BigNumber.ROUND_CEIL,
  }).dividedBy(coreLow);
}
