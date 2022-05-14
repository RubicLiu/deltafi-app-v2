import { PoolConfig } from "constants/deployConfigV2";

export interface CardProps {
  isUserPool?: boolean;
  poolConfig: PoolConfig;
  color?: "lime" | "greenYellow" | "indigo" | "dodgerBlue";
}
