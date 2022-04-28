import fullDeployConfigV2 from "../anchor/fullDeployConfigV2.json";

// TODO(ypeng): Read deploy mode from environment variable.
export const deployConfigV2 = fullDeployConfigV2.testnet;

export function getPoolConfigBySymbols(baseSymbol: String, quoteSymbol: String) {
  return deployConfigV2.poolInfoList.find(
    ({ base, quote }) =>
      (base === baseSymbol && quote === quoteSymbol) ||
      (base === quoteSymbol && quote === baseSymbol),
  );
}

export function getTokenConfigBySymbol(symbolStr: String) {
  return deployConfigV2.tokenInfoList.find(({ symbol }) => symbol === symbolStr);
}

export const poolConfigs = deployConfigV2.poolInfoList;
export const tokenConfigs = deployConfigV2.tokenInfoList;
