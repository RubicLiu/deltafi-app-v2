import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";

export interface CardProps {
  isUserPool?: boolean;
  poolConfig: PoolConfig;
  farmInfoAddress: string;
  totalStaked: BigNumber;
  userStaked: BigNumber;
  apr: BigNumber;
  color?: "lime" | "greenYellow" | "indigo" | "dodgerBlue";
}
