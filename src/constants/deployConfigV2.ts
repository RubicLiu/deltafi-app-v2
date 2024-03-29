import fullDeployConfigV2 from "../anchor/fullDeployConfigV2.json";

export const deployMode = process.env.REACT_APP_DEPLOYMENT_MODE || "mainnet-test";
export const deployConfigV2 = fullDeployConfigV2[deployMode];
export const DELTAFI_TOKEN_DECIMALS = 6; // our token is always with 6 decimals
export const DELTAFI_TOKEN_SYMBOL = "DELFI";

export const enableReferral = true;

export type PoolConfig = {
  name: string;
  base: string;
  quote: string;
  swapInfo: string;
  farmInfoList: { name: string; farmInfo: string }[];
  baseTokenInfo: TokenConfig;
  quoteTokenInfo: TokenConfig;
};

export type PythConfig = {
  price: string;
  product: string;
  productName: string;
  mockPrice: number | null;
};

export type TokenConfig = {
  pyth: PythConfig;
  symbol: string;
  mint: string;
  logoURI: string;
  name: string;
  decimals: number;
};

export const tokenConfigs: TokenConfig[] = deployConfigV2.tokenInfoList;

export function getTokenConfigBySymbol(symbolStr: String): TokenConfig {
  return tokenConfigs.find(({ symbol }) => symbol === symbolStr);
}

export const poolConfigs: PoolConfig[] = deployConfigV2.poolInfoList.map((poolInfo) => {
  const baseTokenInfo = getTokenConfigBySymbol(poolInfo.base);
  const quoteTokenInfo = getTokenConfigBySymbol(poolInfo.quote);
  return {
    ...poolInfo,
    baseTokenInfo,
    quoteTokenInfo,
  };
});

export function getPoolConfigBySymbols(baseSymbol: String, quoteSymbol: String): PoolConfig {
  return poolConfigs.find(
    ({ base, quote }) =>
      (base === baseSymbol && quote === quoteSymbol) ||
      (base === quoteSymbol && quote === baseSymbol),
  );
}

export function getPoolConfigBySwapKey(poolKey: String): PoolConfig {
  return poolConfigs.find(({ swapInfo }) => swapInfo === poolKey);
}

export function getPoolConfigByFarmKey(farmKey: string): PoolConfig {
  return poolConfigs.find(
    ({ farmInfoList }) => !!farmInfoList.find(({ farmInfo }) => farmInfo === farmKey),
  );
}
