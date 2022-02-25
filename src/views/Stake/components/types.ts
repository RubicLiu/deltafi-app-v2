import BigNumber from "bignumber.js";
import { TokenInfo } from "constants/tokens";

export interface SettingsProps {
  priceImpact: string;
  isIncludeDecimal: boolean;
  isSmall?: boolean;
  handleChangeImpact: any;
  handleChangeInclude: any;
  handleClose: any;
}

export interface StakeCard {
  isStake: boolean;
  token: TokenInfo | null | undefined;
  balance: BigNumber;
  amount: string;
}

export interface CardProps {
  card: StakeCard;
  handleChangeCard: any;
  disabled?: boolean;
  tokens?: TokenInfo[];
  disableDrop?: boolean;
  percentage?: number;
}
