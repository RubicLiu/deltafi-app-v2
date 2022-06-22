import BigNumber from "bignumber.js";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { TokenConfig } from "constants/deployConfigV2";
import { anchorBnToBn } from "./tokenUtils";
import { SwapInfo } from "anchor/type_definitions";

export const convertDollar = (value) => {
  return "USD " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const convertDollarSign = (value) => {
  return "$" + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

export function getTokenShareTvl(tvl: BigNumber, share: BN, supply: BN) {
  if (share.isZero()) {
    return new BigNumber(0);
  }
  return tvl
    .multipliedBy(new BigNumber(share.toString()))
    .dividedBy(new BigNumber(supply.toString()));
}

export function getTotalVolume(
  basePrice: BigNumber,
  quotePrice: BigNumber,
  swapInfo: SwapInfo,
  baseTokenInfo: TokenConfig,
  quoteTokenInfo: TokenConfig,
) {
  if (basePrice && quotePrice && swapInfo && baseTokenInfo && quoteTokenInfo) {
    const baseVolume = getTokenTvl(baseTokenInfo, swapInfo.poolState.totalTradedBase, basePrice);
    const quoteVolume = getTokenTvl(
      quoteTokenInfo,
      swapInfo.poolState.totalTradedQuote,
      quotePrice,
    );
    return baseVolume.plus(quoteVolume);
  }
  return new BigNumber(0);
}

export function validate(expression: boolean, errMsg: string) {
  if (expression === false) {
    throw Error(errMsg);
  }
}

export function formatCurrencyAmount(value: number | string | BigNumber) {
  const valueBn = new BigNumber(value);
  if (valueBn.isNaN()) {
    return "--";
  }
  return valueBn.toNumber().toLocaleString("en-US", { style: "currency", currency: "USD" });
}
