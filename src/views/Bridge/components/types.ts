import { TokenConfig } from "constants/deployConfigV2";

export interface SettingsProps {
  priceImpact: string;
  isIncludeDecimal: boolean;
  isSmall?: boolean;
  handleChangeMaxSlippage: any;
  handleChangeInclude: any;
  handleClose: any;
}

export interface SwapCard {
  token: TokenConfig | null | undefined;
  amount: string;
  amountWithSlippage: string;
}

export interface CardProps {
  card: SwapCard;
  handleChangeCard: any;
  disabled?: boolean;
  tokens?: TokenConfig[];
  networks?: [];
  disableDrop?: boolean;
  percentage?: number;
}
