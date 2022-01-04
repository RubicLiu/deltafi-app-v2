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
    address: new PublicKey('EdJu4CF21nGmi21Yyu4tK7JfVn7XxKJEekCJF5UafJNJ'),
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
