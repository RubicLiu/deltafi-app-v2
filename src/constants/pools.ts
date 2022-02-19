import { PublicKey } from '@solana/web3.js'
import { POOLS } from './config.json'
import { NETWORK } from './config.json'

const network = NETWORK;

export interface PoolSchema {
  name: string
  address: PublicKey
  mintAddress: PublicKey
  base: string
  quote: string
}

export const pools: PoolSchema[] = POOLS.map(({name, swap, mint}) => ({
  name, 
  address: new PublicKey(swap), 
  mintAddress: new PublicKey(mint), 
  base: name.split("-")[0], 
  quote: name.split("-")[1]
}))

console.log(pools);


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
