import { PublicKey } from '@solana/web3.js'

export interface PoolSchema {
  name: string
  address: PublicKey
  base: string
  quote: string
}

export const pools: PoolSchema[] = [
  {
    name: 'SOL-SRM',
    address: new PublicKey('4Vq3b8KV6mnL8egijJ4SV9fQxzQivRuTHAs1dmTfhVDH'),
    base: 'SOL',
    quote: 'SRM',
  },
]

export const listSymbols = (pools: PoolSchema[]) => {
  let list = []
  pools.forEach((pool) => {
    if (!list.includes(pool.base)) {
      list.push(`Crypto.${pool.base}/USD`)
    }
    if (!list.includes(pool.quote)) {
      list.push(`Crypto.${pool.quote}/USD`)
    }
  })
  return list
}
