import { PoolConfig } from "constants/deployConfigV2";

export interface CardProps {
  poolConfig: PoolConfig;
  isUserPool?: boolean;
  color?: "lime" | "greenYellow" | "indigo" | "dodgerBlue";
}
