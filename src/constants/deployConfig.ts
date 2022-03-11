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

export function getTokenInfoBySymbol(symbolStr: String) {
  return deployConfig.tokenInfo.find(({ symbol }) => symbol === symbolStr);
}

export const marketConfig: MarketConfig = {
  publicKey: new PublicKey(deployConfig.marketConfigAddress),
  deltafiMint: new PublicKey(deployConfig.deltafiTokenMint),
  deltafiToken: new PublicKey(deployConfig.deltafiToken),
  bumpSeed: deployConfig.bumpSeed,
};
