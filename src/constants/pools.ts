import { PublicKey } from '@solana/web3.js'

const network = process.env.REACT_APP_NETWORK

export interface PoolSchema {
  name: string
  address: PublicKey
  base: string
  quote: string
}

export const pools: PoolSchema[] = [
  {
    name: 'SRM-USDC',
    address: new PublicKey('HJrcEthNx8TGxJ6uTpxmumwDYbyNjJzjzcUvuXBmtY3P'),
    base: 'SRM',
    quote: 'USDC',
  },
]

export const listSymbols = (pools: PoolSchema[]) => {
  let list = []
  const prefix = network === 'mainnet-beta' ? '' : 'Crypto.'
  pools.forEach((pool) => {
    if (!list.includes(pool.base)) {
      list.push(`${prefix}${pool.base}/USD`)
    }
    if (!list.includes(pool.quote)) {
      list.push(`${prefix}${pool.quote}/USD`)
    }
  })
  return list
}
