import { PublicKey } from '@solana/web3.js'
import { poolInfo } from './config.json'
import { PoolSchema } from './pools'

export interface FarmPoolSchema {
  name: string
  address: PublicKey
  poolAddress: PublicKey
  base: string
  quote: string
}

export const farmPools: FarmPoolSchema[] = poolInfo.map(({name, swap, farm}) => ({
  name, 
  address: new PublicKey(farm), 
  poolAddress: new PublicKey(swap),
  base: name.split("-")[0], 
  quote: name.split("-")[1]
}))
