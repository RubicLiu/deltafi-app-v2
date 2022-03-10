// Will replace with spl-token-registry in mainnet launch
import { deployConfig } from "./deployConfig";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

export const tokens: TokenInfo[] = deployConfig.tokenInfo.map((tokenInfo) => {
  return {
    address: tokenInfo.mint,
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    decimals: tokenInfo.decimals,
    logoURI: tokenInfo.logoURI,
  };
});

export const lpTokens: TokenInfo[] = deployConfig.poolInfo.map(({ name, mint, decimals }) => ({
  address: mint,
  symbol: name,
  name: "LP " + name,
  decimals: decimals,
  logoURI: null,
}));
