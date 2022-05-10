import BigNumber from "bignumber.js";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { TokenConfig } from "constants/deployConfigV2";
import { anchorBnToBn } from "./tokenUtils";

export const convertDollar = (value) => {
  return "USD " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function formatPubkey(key: PublicKey) {
  if (key) {
    const keyStr = key.toBase58();
    return keyStr.slice(0, 9) + "..." + keyStr.slice(-3);
  }
  return "";
}

export function fixedNumber(
  number: number | string | null | undefined,
  maxDecimalPlace: number = 6,
): string {
  if (number === null || number === undefined) {
    return "";
  }
  return Number(number).toFixed(maxDecimalPlace);
}

export function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply<number, T[], T[][]>(0, new Array(Math.ceil(array.length / size))).map(
    (_, index) => array.slice(index * size, (index + 1) * size),
  );
}

export function getTokenTvl(tokenConfig: TokenConfig, amount: BN, price: BigNumber) {
  return anchorBnToBn(tokenConfig, amount).multipliedBy(price);
}

export function getUserTokenTvl(tvl: BigNumber, share: BigNumber, supply: BigNumber) {
  if (share.isZero() || share.isNaN()) {
    return new BigNumber(0);
  }
  return tvl.multipliedBy(share).dividedBy(supply);
}

export function validate(expression: boolean, errMsg: string) {
  if (expression === false) {
    throw Error(errMsg);
  }
}
