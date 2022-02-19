import { PublicKey } from '@solana/web3.js'
import { POOLS } from './config.json'
import { PoolSchema } from './pools'

export interface FarmPoolSchema {
  name: string
  address: PublicKey
  poolAddress: PublicKey
  base: string
  quote: string
}

export const farmPools: FarmPoolSchema[] = POOLS.map(({name, swap, farm}) => ({
  name, 
  address: new PublicKey(farm), 
  poolAddress: new PublicKey(swap),
  base: name.split("-")[0], 
  quote: name.split("-")[1]
}))
