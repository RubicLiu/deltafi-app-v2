import BigNumber from "bignumber.js";

function BigNumberWithConfig(
  val: number | BigNumber | string,
  object: BigNumber.Config,
): BigNumber {
  BigNumber.config(object);
  return new BigNumber(val);
}

export function calculateBalancedReservesStableSwap(
  stablePrice: BigNumber,
  currentReserveA: BigNumber,
  currentResreveB: BigNumber,
  slope: BigNumber,
): { balancedReserveA: BigNumber; balancedReserveB: BigNumber } {
  let coefA: BigNumber = new BigNumber(2).minus(slope).multipliedBy(stablePrice);
  let coefBNeg: BigNumber = new BigNumber(1)
    .minus(slope)
    .multipliedBy(currentReserveA.multipliedBy(stablePrice).plus(currentResreveB));
  let coefCNeg: BigNumber = slope.multipliedBy(currentReserveA).multipliedBy(currentResreveB);
  // need to ceil the sqrt
  let core: BigNumber = BigNumberWithConfig(
    coefBNeg
      .multipliedBy(coefBNeg)
      .plus(coefA.multipliedBy(coefCNeg).multipliedBy(new BigNumber(4))),
    {
      ROUNDING_MODE: BigNumber.ROUND_CEIL,
    },
  ).squareRoot();

  // need to ceil the div
  let balancedReserveA: BigNumber = BigNumberWithConfig(coefBNeg.plus(core), {
    ROUNDING_MODE: BigNumber.ROUND_CEIL,
  })
    .dividedBy(coefA)
    .dividedBy(new BigNumber(2));
  let balancedReserveB: BigNumber = balancedReserveA.multipliedBy(stablePrice);

  return { balancedReserveA, balancedReserveB };
}

export function calculateOutAmountStableSwapInternal(
  balancedReserveA: BigNumber,
  balancedReserveB: BigNumber,
  currentReserveA: BigNumber,
  currentResreveB: BigNumber,
  inputAAmount: BigNumber,
  slope: BigNumber,
): BigNumber {
  let multiplicand: BigNumber = BigNumberWithConfig(
    balancedReserveB.multipliedBy(new BigNumber(1).minus(slope)),
    {
      ROUNDING_MODE: BigNumber.ROUND_FLOOR,
    },
  )
    .dividedBy(slope)
    .plus(currentResreveB);

  let coreNumerator: BigNumber = new BigNumber(1)
    .minus(slope)
    .multipliedBy(balancedReserveA)
    .plus(slope.multipliedBy(currentReserveA));

  let coreDenumerator: BigNumber = new BigNumber(1)
    .minus(slope)
    .multipliedBy(balancedReserveA)
    .plus(slope.multipliedBy(currentReserveA.plus(inputAAmount)));

  let multiplier: BigNumber = new BigNumber(1).minus(
    BigNumberWithConfig(coreNumerator, {
      ROUNDING_MODE: BigNumber.ROUND_FLOOR,
    }).dividedBy(coreDenumerator),
  );

  return multiplicand.multipliedBy(multiplier);
}

export function calculateOutAmountStableSwap(
  stablePrice: BigNumber,
  currentReserveA: BigNumber,
  currentReserveB: BigNumber,
  inputAAmount: BigNumber,
  slope: BigNumber,
): number {
  let { balancedReserveA, balancedReserveB } = calculateBalancedReservesStableSwap(
    stablePrice,
    currentReserveA,
    currentReserveB,
    slope,
  );

  let result: BigNumber = calculateOutAmountStableSwapInternal(
    balancedReserveA,
    balancedReserveB,
    currentReserveA,
    currentReserveB,
    inputAAmount,
    slope,
  );

  return Math.floor(result.toNumber());
}
