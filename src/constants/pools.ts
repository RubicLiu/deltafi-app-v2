import { PublicKey } from "@solana/web3.js";
import { deployConfig } from "./deployConfig";

export interface PoolSchema {
  name: string;
  address: PublicKey;
  mintAddress: PublicKey;
  base: string;
  quote: string;
}

export const pools: PoolSchema[] = deployConfig.poolInfo.map(
  ({ name, swap, mint, base, quote }) => ({
    name,
    address: new PublicKey(swap),
    mintAddress: new PublicKey(mint),
    base,
    quote,
  }),
);
