import { PublicKey } from "@solana/web3.js";

export interface CardProps {
  isUserPool?: boolean;
  poolKey: PublicKey;
}
