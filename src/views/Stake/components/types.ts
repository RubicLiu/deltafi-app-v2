import { PoolConfig, TokenConfig } from "constants/deployConfigV2";

export interface SettingsProps {
  priceImpact: string;
  isIncludeDecimal: boolean;
  isSmall?: boolean;
  handleChangeImpact: any;
  handleChangeInclude: any;
  handleClose: any;
}

export interface StakeCard {
  baseTotalAmount: string;
  quoteTotalAmount: string;
  baseStakedAmount: string;
  quoteStakedAmount: string;
  baseSelectedAmount: string;
  quoteSelectedAmount: string;
}

export interface CardProps {
  poolConfig: PoolConfig;
  card: StakeCard;
  handleChangeCard: any;
  disabled?: boolean;
  tokens?: TokenConfig[];
  disableDrop?: boolean;
  percentage?: number;
}
