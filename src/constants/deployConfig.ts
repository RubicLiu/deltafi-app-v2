import fullDeployConfig from "./fullDeployConfig.json";

export const deployConfig =
  fullDeployConfig[process.env.REACT_APP_DEPLOYMENT_MODE || "mainnet-test"];

export function getPoolConfigByFarmPoolKey(farmPoolKey: String) {
  return deployConfig.poolInfo.find(({ farm }) => farm === farmPoolKey);
}

export function getPoolConfigByPoolKey(poolKey: String) {
  return deployConfig.poolInfo.find(({ swap }) => swap === poolKey);
}

export function getTokenInfoBySymbol(symbolStr: String) {
  return deployConfig.tokenInfo.find(({ symbol }) => symbol === symbolStr);
}
