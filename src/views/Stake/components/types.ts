import BigNumber from "bignumber.js";
import { TokenConfig } from "constants/deployConfig";
import { PoolConfig } from "constants/deployConfigV2";

export interface SettingsProps {
  priceImpact: string;
  isIncludeDecimal: boolean;
  isSmall?: boolean;
  handleChangeImpact: any;
  handleChangeInclude: any;
  handleClose: any;
}

export interface StakeCard {
  poolConfig: PoolConfig;
  isStake: boolean;
  balance: BigNumber;
  amount: string;
  baseAmount: string;
  quoteAmount: string;
}

export interface CardProps {
  card: StakeCard;
  handleChangeCard: any;
  disabled?: boolean;
  tokens?: TokenConfig[];
  disableDrop?: boolean;
  percentage?: number;
}
