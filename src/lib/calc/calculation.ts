import BigNumber from "bignumber.js";

function BigNumberWithConfig(
  val: number | BigNumber | string,
  object: BigNumber.Config,
): BigNumber {
  BigNumber.config(object);
  return new BigNumber(val);
}

const FLOAT_ROUND_UP_ESPSILON: number = 0.00000000000000006;

/**
 * calculate out amount from v2 g(m) curve, with slope=1 case. the formula is:
 * - token_b_output = b - b * ((a / (a + m))^(P * A / B))
 * - a = current_reserve_a, b = current_reserve_b (current token reserves in the pool)
 * - m is the amount of token a trader want to sell to us
 * - A = target_reserve_a, B = target_reserve_b (A/B is the token ratio we want to maintain)
 * - P = market price, (the number of token b can be purchased by 1 token a)
 */
export function calculateOutAmountNormalSwapInternal(
  marketPrice: BigNumber,
  targetReserveA: BigNumber,
  targetReserveB: BigNumber,
  currentReserveA: BigNumber,
  currentResreveB: BigNumber,
  inputAAmount: BigNumber,
): BigNumber {
  // need to ceil the core
  let core: BigNumber = BigNumberWithConfig(currentReserveA, {
    ROUNDING_MODE: BigNumber.ROUND_CEIL,
  }).dividedBy(currentReserveA.plus(inputAAmount));

  // need to floor the exp
  let exp: BigNumber = BigNumberWithConfig(marketPrice, {
    ROUNDING_MODE: BigNumber.ROUND_FLOOR,
  })
    .multipliedBy(targetReserveA)
    .dividedBy(targetReserveB);

  let coreNumber = core.toNumber();
  let expNumber = exp.toNumber();
  // round up the float value of core^exp
  let coreExpNumber = Math.pow(coreNumber, expNumber) + FLOAT_ROUND_UP_ESPSILON;

  // need to ceil the coreExp
  let coreExp: BigNumber = BigNumberWithConfig(currentResreveB.toNumber(), {
    ROUNDING_MODE: BigNumber.ROUND_CEIL,
  }).multipliedBy(new BigNumber(coreExpNumber));

  return currentResreveB.minus(coreExp);
}

/**
 * get the maximum value between the approximation result and calculation using
 * calculate_out_amount_normal_swap_internal
 * both approximation and calculation results are guaranteed to be less or equal to
 * the theoretical value. we take max of them to get a closer value to the ideal result
 */
export function calculateOutAmountNormalSwap(
  marketPrice: BigNumber,
  targetReserveA: BigNumber,
  targetReserveB: BigNumber,
  currentReserveA: BigNumber,
  currentResreveB: BigNumber,
  inputAAmount: BigNumber,
): number {
  // TODO(leqiang): add approximation result here
  return Math.floor(
    calculateOutAmountNormalSwapInternal(
      marketPrice,
      targetReserveA,
      targetReserveB,
      currentReserveA,
      currentResreveB,
      inputAAmount,
    ).toNumber(),
  );
}
