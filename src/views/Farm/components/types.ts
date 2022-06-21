import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";

export type FarmCardColor = "lime" | "greenYellow" | "indigo" | "dodgerBlue";

export interface CardProps {
  isUserPool?: boolean;
  poolConfig: PoolConfig;
  farmInfoAddress: string;
  totalStaked: BigNumber;
  userStaked: BigNumber;
  apr: BigNumber;
  color?: FarmCardColor;
}
