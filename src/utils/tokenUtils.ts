import { BN } from "@project-serum/anchor";
import BigNumber from "bignumber.js";
import { TokenConfig } from "constants/deployConfigV2";
import { exponentiate, exponentiatedBy } from "./decimal";

export function bnToString(tokenConfig: TokenConfig, amount: BigNumber): string {
  return amount.toFixed(tokenConfig.decimals);
}

export function bnToAnchorBn(tokenConfig: TokenConfig, amount: BigNumber): BN {
  return new BN(exponentiate(amount, tokenConfig.decimals).toFixed(0));
}

export function anchorBnToBn(tokenConfig: TokenConfig, amount: BN): BigNumber {
  return exponentiatedBy(new BigNumber(amount.toString()), tokenConfig.decimals);
}

export function anchorBnToString(tokenConfig: TokenConfig, amount: BN): string {
  return bnToString(tokenConfig, anchorBnToBn(tokenConfig, amount));
}

export function stringToAnchorBn(tokenConfig: TokenConfig, amount: string): BN {
  return bnToAnchorBn(tokenConfig, new BigNumber(amount));
}