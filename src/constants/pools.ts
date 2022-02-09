import { PublicKey } from '@solana/web3.js'

const network = process.env.REACT_APP_NETWORK

export interface PoolSchema {
  name: string
  address: PublicKey
  mintAddress: PublicKey
  base: string
  quote: string
}

export const pools: PoolSchema[] = [
  {
    name: 'SOL-USDC',
    address: new PublicKey('3yULY47fwzXwu6nxuXnLtAQHyNN1iMDcszyxBPkiNNFt'), 
    mintAddress: new PublicKey('B3DbGtEV9m6swD8ZHUZyrf3EEV1J4EkDDa6kn5ow1jxG'), 
    base: 'SOL',
    quote: 'USDC',
  },
  {
    name: 'SRM-USDC',
    address: new PublicKey('AorxH9q8oMR1di6r8dWKCiBMKgY8vGCodfV5rm3acHz3'), 
    mintAddress: new PublicKey('8Y22Dki1qVX7RbD5kPfZNR1g6LLnABTPQsY1Zidn6sdo'), 
    base: 'SRM',
    quote: 'USDC',
  },
  {
    name: 'SOL-SRM',
    address: new PublicKey('6MUGmm3BpA6NTCL83KrbSRFiEs53YhQ1etnMd3Y23HYp'),
    mintAddress: new PublicKey('BY4fH4Dkjtv6MHH8WaPpBgrSySDpxNCMvAavyXG7ZYKd'),
    base: 'SOL',
    quote: 'SRM',
  },
]

export const listSymbols = (pools: PoolSchema[]) => {
  let list = []
  const prefix = 'Crypto.'
  pools.forEach((pool) => {
    if (!list.includes(`${prefix}${pool.base}/USD`)) {
      list.push(`${prefix}${pool.base}/USD`)
    }
    if (!list.includes(`${prefix}${pool.quote}/USD`)) {
      list.push(`${prefix}${pool.quote}/USD`)
    }
  })
  return list
}
