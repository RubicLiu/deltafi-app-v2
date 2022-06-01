import { PoolConfig } from "constants/deployConfigV2";

export interface CardProps {
  isUserPool?: boolean;
  poolConfig: PoolConfig;
  farmInfoAddress: string;
  color?: "lime" | "greenYellow" | "indigo" | "dodgerBlue";
}
