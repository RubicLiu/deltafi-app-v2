import { PublicKey } from "@solana/web3.js";
import { struct } from "buffer-layout";

import { bool, publicKey } from "utils/layout";

export enum SwapType {
  /// Standard swap pool with external price
  Normal = 0,
  /// Stable swap pool
  Stable,
}

export enum OraclePriority {
  /// Only use Oracle from PYTH
  PYTH_ONLY = 0,
  /// Only use Oracle from SERUM
  SERUM_ONLY = 1,
}

export interface UserReferrerData {
  isInitialized: boolean;
  configKey: PublicKey;
  owner: PublicKey;
  referrer: PublicKey;
}

/** @internal */
export const UserReferrerDataLayout = struct<UserReferrerData>(
  [bool("isInitialized"), publicKey("configKey"), publicKey("owner"), publicKey("referrer")],
  "userReferrerData",
);

export const USER_REFERRER_DATA_SIZE = UserReferrerDataLayout.span;
