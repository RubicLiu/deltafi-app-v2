// Will replace with spl-token-registry in mainnet launch
import { poolInfo, network } from "./config.json";

export interface TokenInfo {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

export const tokens: TokenInfo[] = {
  "mainnet-beta": [
    {
      chainId: 101,
      address: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
      symbol: "SRM",
      name: "Serum",
      decimals: 6,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png",
    },
    {
      chainId: 101,
      address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "SOL",
      decimals: 9,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },
    {
      chainId: 101,
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    },
    {
      chainId: 101,
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      symbol: "USDT",
      name: "USDT",
      decimals: 6,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4/logo.png",
    },
  ],

  testnet: [
    {
      chainId: 101,
      address: "HMCW6tEvAJirwTGbdhpcsv8eFBiNS4Ti6rwMbf5VyAUv",
      symbol: "SRM",
      name: "SRM",
      decimals: 9,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png",
    },
    {
      chainId: 101,
      address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "SOL",
      decimals: 9,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },
    {
      chainId: 101,
      address: "9ZiQNDXaiC7TQAfKcha4hjiSPdxDJfw7pKKsJT49mjfe",
      symbol: "USDC",
      name: "USDC",
      decimals: 9,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    },
    {
      chainId: 101,
      address: "44PHKq7n7ymWc2aBj4JS97hZHRT9Uc25Aa4kaLJhaMck",
      symbol: "USDT",
      name: "USDT",
      decimals: 9,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4/logo.png",
    },
  ],
}[network];

export const lpTokens: TokenInfo[] = poolInfo.map(({ name, mint, decimals }) => ({
  chainId: 101,
  address: mint,
  symbol: name,
  name: "LP " + name,
  decimals: decimals,
  logoURI: " ",
}));
