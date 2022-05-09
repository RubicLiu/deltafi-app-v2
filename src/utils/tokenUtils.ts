import { BN } from "@project-serum/anchor";
import BigNumber from "bignumber.js";
import { PoolConfig, TokenConfig } from "constants/deployConfigV2";
import { exponentiate, exponentiatedBy } from "./decimal";

export class tokenAmountConverter {
  public tokenConfig: TokenConfig;

  public constructor(tokenConfig: TokenConfig) {
    this.tokenConfig = tokenConfig;
  }

  public bnToString(amount: BigNumber) {
    return amount.toFixed(this.tokenConfig.decimals);
  }

  public bnToAnchor(amount: BigNumber) {
    new BN(exponentiate(amount, this.tokenConfig.decimals).toFixed(0));
  }

  public anchorToBN(amount: BN) {
    return exponentiatedBy(new BigNumber(amount.toString()), this.tokenConfig.decimals);
  }

  public anchorToString(amount: BN) {
    return this.bnToString(this.anchorToBN(amount));
  }

  public stringToBN(amount: string) {
    return new BigNumber(amount);
  }

  public stringToAnchor(amount: string) {
    return this.bnToAnchor(new BigNumber(amount));
  }
}

export function getTokenAmountConverters(poolConfig: PoolConfig) {
  return [
    new tokenAmountConverter(poolConfig.baseTokenInfo),
    new tokenAmountConverter(poolConfig.quoteTokenInfo),
  ];
}
