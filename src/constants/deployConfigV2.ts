import fullDeployConfigV2 from "../anchor/fullDeployConfigV2.json";

// TODO(ypeng): Read deploy mode from environment variable.
export const deployConfigV2 = fullDeployConfigV2.testnet;

export type PoolConfig = {
  name: string;
  base: string;
  quote: string;
  swapInfo: string;
  farmInfo: string;
};

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

export function getPoolConfigBySymbols(baseSymbol: String, quoteSymbol: String): PoolConfig {
  return deployConfigV2.poolInfoList.find(
    ({ base, quote }) =>
      (base === baseSymbol && quote === quoteSymbol) ||
      (base === quoteSymbol && quote === baseSymbol),
  );
}

export function getTokenConfigBySymbol(symbolStr: String): TokenConfig {
  return deployConfigV2.tokenInfoList.find(({ symbol }) => symbol === symbolStr);
}

export const poolConfigs: PoolConfig[] = deployConfigV2.poolInfoList;
export const tokenConfigs: TokenConfig[] = deployConfigV2.tokenInfoList;
