import { PublicKey } from "@solana/web3.js";
import { deployConfig } from "./deployConfig";

export interface FarmPoolSchema {
  name: string;
  address: PublicKey;
  poolAddress: PublicKey;
  base: string;
  quote: string;
}

export const farmPools: FarmPoolSchema[] = deployConfig.poolInfo.map(({ name, swap, farm, base, quote }) => ({
  name,
  address: new PublicKey(farm),
  poolAddress: new PublicKey(swap),
  base,
  quote,
}));
