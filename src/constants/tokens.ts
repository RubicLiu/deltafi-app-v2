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
    address: 'HMufPL1V6SJAfSNfU1t2JP9S83FbcWv7dYes8QMPKrMT',
    symbol: 'SOL',
    name: 'Deltafi SOL',
    decimals: 9,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  {
    chainId: 101,
    address: '64MqsbX14kao2UcyFT7J3MKwctfiifs5K4uZqJFfxe5',
    symbol: 'SRM',
    name: 'Deltafi SRM',
    decimals: 9,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png',
  },
]

export const lpTokens: TokenInfo[] = [
  {
    chainId: 101,
    address: '5ZE4QgqSWf7YSaCapkN9JpMer1xFrVSMjbmb9bJHAwdm',
    symbol: 'SOL-SRM',
    name: 'LP SOL-SRM',
    decimals: 9,
    logoURI: '',
  },
]
