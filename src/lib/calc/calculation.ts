import BigNumber from "bignumber.js";

export function calculateOutAmountNormalSwap(
  marketPrice: BigNumber,
  targetReserveA: BigNumber,
  targetReserveB: BigNumber,
  currentReserveA: BigNumber,
  currentResreveB: BigNumber,
  inputAAmount: BigNumber,
): number {
  // need to ceil
  let core: BigNumber = currentReserveA.dividedBy(currentReserveA.plus(inputAAmount));
  let exp: BigNumber = marketPrice.multipliedBy(targetReserveA).dividedBy(targetReserveB);
  let core_number = core.toNumber();
  let exp_number = exp.toNumber();
  let core_exp_number = Math.pow(core_number, exp_number);

  // need to ceil
  let core_exp: BigNumber = new BigNumber(core_exp_number);
  let result: BigNumber = currentResreveB.minus(core_exp);

  return Math.floor(result.toNumber());
}

function calculateBalancedReservesStableSwap(
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
  let core: BigNumber = coefBNeg
    .multipliedBy(coefBNeg)
    .plus(coefA.multipliedBy(coefCNeg))
    .multipliedBy(coefCNeg)
    .multipliedBy(new BigNumber(4))
    .squareRoot();

  // need to ceil the div
  let balancedReserveA: BigNumber = coefBNeg
    .plus(core)
    .dividedBy(coefA)
    .dividedBy(new BigNumber(2));
  let balancedReserveB: BigNumber = balancedReserveA.multipliedBy(stablePrice);

  return { balancedReserveA, balancedReserveB };
}

function calculateOutAmountStableSwapInternal(
  balancedReserveA: BigNumber,
  balancedReserveB: BigNumber,
  currentReserveA: BigNumber,
  currentResreveB: BigNumber,
  inputAAmount: BigNumber,
  slope: BigNumber,
): BigNumber {
  let multiplicand: BigNumber = balancedReserveB.multipliedBy(
    new BigNumber(1).minus(slope).dividedBy(slope).plus(currentResreveB),
  );

  let coreNumerator: BigNumber = new BigNumber(1)
    .minus(slope)
    .multipliedBy(balancedReserveA)
    .plus(slope.multipliedBy(currentReserveA));

  let coreDenumerator: BigNumber = new BigNumber(1)
    .minus(slope)
    .multipliedBy(balancedReserveA)
    .plus(slope.multipliedBy(currentReserveA.plus(inputAAmount)));

  let multiplier: BigNumber = new BigNumber(1).minus(coreNumerator.dividedBy(coreDenumerator));

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
