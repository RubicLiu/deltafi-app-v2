import { AccountInfo, PublicKey, Connection } from "@solana/web3.js";
import { blob, seq, struct, u8 } from "buffer-layout";

import { AccountParser, bool, publicKey, u64 } from "utils/layout";
import { loadAccount } from "utils/account";

export interface FarmInfo {
  isInitialized: boolean;
  bumpSeed: number;
  configKey: PublicKey;
  poolMint: PublicKey;
  poolToken: PublicKey;
  reservedAmount: bigint;
  feeNumerator: bigint;
  feeDenominator: bigint;
  aprNumerator: bigint;
  aprDenominator: bigint;
}

/** @internal */
export const FarmInfoLayout = struct<FarmInfo>(
  [
    bool("isInitialized"),
    u8("bumpSeed"),
    publicKey("configKey"),
    publicKey("poolMint"),
    publicKey("poolToken"),
    u64("reservedAmount"),
    u64("feeNumerator"),
    u64("feeDenominator"),
    u64("aprNumerator"),
    u64("aprDenominator"),
    blob(64, "reserved"),
  ],
  "farmInfo",
);

export const FARM_INFO_SIZE = FarmInfoLayout.span;

export const isFarmInfo = (info: AccountInfo<Buffer>): boolean => {
  return info.data.length === FARM_INFO_SIZE;
};

export const parseFarmInfo: AccountParser<FarmInfo> = (info: AccountInfo<Buffer>) => {
  if (!isFarmInfo(info)) return;

  const buffer = Buffer.from(info.data);
  const farmInfo = FarmInfoLayout.decode(buffer);

  if (!farmInfo.isInitialized) return;

  return {
    info,
    data: farmInfo,
  };
};

export const loadFarmInfo = async (
  connection: Connection,
  key: string,
  farmProgramId: PublicKey,
): Promise<{ key: string; data: FarmInfo }> => {
  const address = new PublicKey(key);
  const accountInfo = await loadAccount(connection, address, farmProgramId);

  const parsed = parseFarmInfo(accountInfo);

  if (!parsed) throw new Error("Failed to load farm info account");

  return {
    key,
    data: parsed.data,
  };
};

export interface FarmPosition {
  pool: PublicKey;
  depositedAmount: bigint;
  rewardsOwed: bigint;
  rewardsEstimated: bigint;
  cumulativeInterest: bigint;
  lastUpdateTs: bigint;
  nextClaimTs: bigint;
}

/** @internal */
export const FarmPositionLayout = struct<FarmPosition>([
  publicKey("pool"),
  u64("depositedAmount"),
  u64("rewardsOwed"),
  u64("rewardsEstimated"),
  u64("cumulativeInterest"),
  u64("lastUpdateTs"),
  u64("nextClaimTs"),
  u64("latestDepositSlot"),
]);

export const FARM_POSITION_SIZE = FarmPositionLayout.span;

export interface FarmUser {
  isInitialized: boolean;
  configKey: PublicKey;
  owner: PublicKey;
  positions: Array<FarmPosition>;
}

export interface FarmUserDataFlat {
  isInitialized: boolean;
  configKey: PublicKey;
  owner: PublicKey;
  positionLen: number;
  dataFlat: Buffer;
}

/** @internal */
export const FarmUserLayout = struct<FarmUserDataFlat>(
  [
    bool("isInitialized"),
    publicKey("configKey"),
    publicKey("owner"),
    u8("positionLen"),
    blob(FarmPositionLayout.span * 10, "dataFlat"),
  ],
  "farmUser",
);

export const FARM_USER_SIZE = FarmUserLayout.span;

export const isFarmUser = (info: AccountInfo<Buffer>) => info.data.length === FARM_USER_SIZE;

export const parseFarmUser: AccountParser<FarmUser> = (info: AccountInfo<Buffer>) => {
  if (!isFarmUser(info)) return;

  const buffer = Buffer.from(info.data);
  const { isInitialized, configKey, owner, positionLen, dataFlat } = FarmUserLayout.decode(buffer);

  if (!isInitialized) return;

  const positionSpan = FarmPositionLayout.span * positionLen;
  const positionsBuffer = dataFlat.slice(0, positionSpan);
  const positions = seq(FarmPositionLayout, positionLen).decode(positionsBuffer);

  return {
    info,
    data: {
      isInitialized,
      configKey,
      owner,
      positions,
    },
  };
};

export const loadFarmUser = async (
  connection: Connection,
  key: string,
  farmProgramId: PublicKey,
): Promise<{ data: FarmUser; key: string }> => {
  const address = new PublicKey(key);
  const accountInfo = await loadAccount(connection, address, farmProgramId);

  const parsed = parseFarmUser(accountInfo);

  if (!parsed) throw new Error("Failed to load farm user account");

  return {
    key,
    data: parsed.data,
  };
};
