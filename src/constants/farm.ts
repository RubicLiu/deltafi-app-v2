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

<<<<<<< HEAD
export const farmPools: FarmPoolSchema[] = poolInfo.map(({name, swap, farm}) => ({
  name, 
  address: new PublicKey(farm), 
  poolAddress: new PublicKey(swap),
  base: name.split("-")[0], 
  quote: name.split("-")[1]
=======
export const farmPools: FarmPoolSchema[] = poolInfo.map(({name, swap, farm, base, quote}) => ({
  name, 
  address: new PublicKey(farm), 
  poolAddress: new PublicKey(swap),
  base,
  quote,
>>>>>>> 61c564dda497a9444e0ea80bece839fab186ae00
}))
