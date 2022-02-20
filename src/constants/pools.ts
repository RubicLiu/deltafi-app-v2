import { PublicKey } from '@solana/web3.js'
import { poolInfo } from './config.json'

export interface PoolSchema {
  name: string
  address: PublicKey
  mintAddress: PublicKey
  base: string
  quote: string
}

<<<<<<< HEAD
export const pools: PoolSchema[] = poolInfo.map(({name, swap, mint}) => ({
  name, 
  address: new PublicKey(swap), 
  mintAddress: new PublicKey(mint), 
  base: name.split("-")[0], 
  quote: name.split("-")[1]
=======
export const pools: PoolSchema[] = poolInfo.map(({name, swap, mint, base, quote}) => ({
  name, 
  address: new PublicKey(swap), 
  mintAddress: new PublicKey(mint), 
  base,
  quote
>>>>>>> 61c564dda497a9444e0ea80bece839fab186ae00
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
