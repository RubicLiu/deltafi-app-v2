import { TokenInfo } from "constants/tokens";

export interface SettingsProps {
  priceImpact: string;
  isIncludeDecimal: boolean;
  isSmall?: boolean;
  handleChangeImpact: any;
  handleChangeInclude: any;
  handleClose: any;
}

export interface SwapCard {
  token: TokenInfo | null | undefined;
  amount: string;
  amountWithSlippage: string;
}

export interface CardProps {
  card: SwapCard;
  handleChangeCard: any;
  disabled?: boolean;
  tokens?: TokenInfo[];
  disableDrop?: boolean;
  percentage?: number;
}
