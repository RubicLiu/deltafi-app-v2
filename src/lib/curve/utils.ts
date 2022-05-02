import BigNumber from "bignumber.js";

export function BigNumberWithConfig(
  val: number | BigNumber | string,
  object: BigNumber.Config,
): BigNumber {
  const BN = BigNumber.clone(object);
  return new BN(val);
}
