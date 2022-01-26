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
    name: 'SRM',
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png",
  },
  {
    chainId: 101,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USDC',
    decimals: 6,
    logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
]

export const lpTokens: TokenInfo[] = [
  {
    chainId: 101,
    address: 'GaT8mSsujTByV2VFzqcQuNtSvarSkKyn2k6Mqrvp2ddU',
    symbol: 'SRM-USDC',
    name: 'LP SRM-USDC',
    decimals: 9,
    logoURI: '',
  },
]
