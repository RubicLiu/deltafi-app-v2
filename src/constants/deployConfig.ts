import fullDeployConfig from "./fullDeployConfig.json";

export const deployConfig = fullDeployConfig[process.env.REACT_APP_DEPLOYMENT_MODE || "mainnet-test"];
