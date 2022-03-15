import { PublicKey } from "@solana/web3.js";

import { MarketConfig } from "providers/types";
import fullDeployConfig from "./fullDeployConfig.json";

export const deployConfig =
  fullDeployConfig[process.env.REACT_APP_DEPLOYMENT_MODE || "mainnet-test"];

export type PoolConfig = {
  name: string;
  base: string;
  quote: string;
  swap: string;
  mint: string;
  farm: string;
  token: string;
  decimals: number;
};

export const poolConfigs: PoolConfig[] = deployConfig.poolInfo;

export function getPoolConfigByFarmPoolKey(farmPoolKey: String): PoolConfig {
  return poolConfigs.find(({ farm }) => farm === farmPoolKey);
}

export function getPoolConfigByPoolKey(poolKey: String): PoolConfig {
  return poolConfigs.find(({ swap }) => swap === poolKey);
}

export function getPoolConfigBySymbols(baseSymbol: String, quoteSymbol: String): PoolConfig {
  return poolConfigs.find(
    ({ base, quote }) =>
      (base === baseSymbol && quote === quoteSymbol) ||
      (base === quoteSymbol && quote === baseSymbol),
  );
}

export type PythConfig = {
  price: string;
  product: string;
};

export type TokenConfig = {
  pyth: PythConfig;
  symbol: string;
  mint: string;
  logoURI: string;
  name: string;
  decimals: number;
};

export const tokenConfigs: TokenConfig[] = deployConfig.tokenInfo;
export const lpTokenConfigs: TokenConfig[] = poolConfigs.map(({ name, mint, decimals }) => ({
  pyth: null,
  mint,
  symbol: name,
  name: "LP " + name,
  decimals,
  logoURI: null,
}));
export const allTokenConfigs: TokenConfig[] = tokenConfigs.concat(lpTokenConfigs);

export function getTokenConfigBySymbol(symbolStr: String): TokenConfig {
  return allTokenConfigs.find(({ symbol }) => symbol === symbolStr);
}

export function getTokenConfigByMint(mintStr: String): TokenConfig {
  return allTokenConfigs.find(({ mint }) => mint === mintStr);
}

export const marketConfig: MarketConfig = {
  publicKey: new PublicKey(deployConfig.marketConfigAddress),
  deltafiMint: new PublicKey(deployConfig.deltafiTokenMint),
  deltafiToken: new PublicKey(deployConfig.deltafiToken),
  bumpSeed: deployConfig.bumpSeed,
};
