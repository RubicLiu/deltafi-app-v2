import { TokenConfig } from "constants/deployConfigV2";

export interface SettingsProps {
    priceImpact: string;
    isIncludeDecimal: boolean;
    isSmall?: boolean;
    handleChangeMaxSlippage: any;
    handleChangeInclude: any;
    handleClose: any;
  }
  
  export interface IDepositCard {
    token: TokenConfig | null | undefined;
    amount: string;
    maxAmount?: string;
  }
  
  export interface DepositCardProps {
    card: IDepositCard;
    handleChangeCard: any;
    disableDrop?: boolean;
    withdrawal?: string;
  }
  