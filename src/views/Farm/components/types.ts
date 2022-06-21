import BigNumber from "bignumber.js";
import { PoolConfig } from "constants/deployConfigV2";
import { PoolCardColor } from "utils/type";

export interface CardProps {
  isUserPool?: boolean;
  poolConfig: PoolConfig;
  farmInfoAddress: string;
  totalStaked: BigNumber;
  userStaked: BigNumber;
  apr: BigNumber;
  color?: PoolCardColor;
}
