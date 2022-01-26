import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

export const SWAP_PROGRAM_ID = new PublicKey('D3UC98n8VwyUUJFQeNshAb1VeZWKXjgWMzvAzK7JX3r7')
export const MARKET_CONFIG_ADDRESS = new PublicKey('AVeQzRzypm2osnSB5YNQR4fzNQx9Z6vG2Zm5Cj4bdF3u')
export const DELTAFI_TOKEN_MINT = new PublicKey('5xiNktJi1XYSkGx9khryhd6NvfM4cB7GFteAKCnEYCEC')

export const WAD_LENGTH = 12

export const WAD = new BigNumber(`1e+${WAD_LENGTH}`)

export const HOMEPAGE_LINK = process.env.REACT_HOMPAGE_URL || 'https://deltafi.ai'
export const APP_LINK = process.env.REACT_APP_URL || 'http://localhost:3001'
export const BLOG_LINK = 'https://medium.com/deltafi'
export const TWITTER_LINK = 'https://twitter.com/deltafi_ai'
export const DISCORD_LINK = 'https://discord.com/invite/6maaM2cYqr'
export const GITHUB_LINK = 'https://github.com/delta-fi'
export const TELEGRAM_LINK = 'https://t.me/deltafi_ai'
export const YOUTUBE_LINK = 'https://youtube.com'
export const SOLSCAN_LINK = 'https://solscan.io'

export const MAINNET_CHAIN_ID = 1
export const connectorLocalStorageKey = 'connectorId'

export const WALLETS = {
  LEDGER: 'Ledger',
  SOLFLARE: 'Solflare',
  SOLFLARE_EXTENSION: 'Solflare Extension',
  SOLLET: 'Sollet',
  SOLLET_EXTENSION: 'Sollet Extension',
  PHANTOM: 'Phantom',
  COIN98: 'Coin98',
  SAFEPAL: 'Safepal',
  MATHWALLLET: 'MathWallet',
}
