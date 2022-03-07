import fullDeployConfig from "./fullDeployConfig.json";

export const deployConfig = fullDeployConfig[process.env.REACT_APP_DEPLOYMENT_MODE || "mainnet-test"];

export function getPoolConfigByFarmPoolKey(farmPoolKey: String) {
  const poolInfoList = deployConfig.poolInfo;
  return poolInfoList.find(({ farm }) => farm === farmPoolKey);
}

export function getPoolConfigByPoolKey(poolKey: String) {
  const poolInfoList = deployConfig.poolInfo;
  return poolInfoList.find(({ swap }) => swap === poolKey);
}
