// Will replace with spl-token-registry in mainnet launch

export interface TokenInfo {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
}

export const tokens: TokenInfo[] = [
  {
    chainId: 101,
    address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    symbol: 'SRM',
    name: 'Serum',
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png",
  },
  {
    chainId: 101,
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'SOL',
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    chainId: 101,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
]

export const lpTokens: TokenInfo[] = [
  {
    chainId: 101,
    address: '5oaagwfJiWMKrTyWnu6iUVckJA7HDfLqeyrQVfa48Tkf',
    symbol: 'SOL-USDC',
    name: 'LP SOL-USDC',
    decimals: 9,
    logoURI: '',
  },
  {
    chainId: 101,
    address: '23Hw8AY1LFMoTw8nWsGw5MXLCUghDDxX9yr8R7bWFaJc',
    symbol: 'SRM-USDC',
    name: 'LP SRM-USDC',
    decimals: 9,
    logoURI: '',
  },
  {
    chainId: 101,
    address: 'CmHe7bFBh44EnBY6s2vr8s1pDdwssPtQFqNfuebp52Ay',
    symbol: 'SOL-SRM',
    name: 'LP SOL-SRM',
    decimals: 9,
    logoURI: '',
  },  
]
