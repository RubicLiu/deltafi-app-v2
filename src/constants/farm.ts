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

// export const farmPools: FarmPoolSchema[] = [
//   {
//     name: 'SRM-USDC',
//     address: new PublicKey('CD6peeUopKcKakgQs2QbN464vCr2oztDAMGgMWqrmjXA'),
//     poolAddress: new PublicKey('9D2YvHZfNuDq5QTohtSZy4CWCRxYnow9ZZtBMswHuJ7h'),
//     base: 'SRM',
//     quote: 'USDC',
//   },
  
//   {
//     name: 'SOL-SRM',
//     address: new PublicKey('Co6WBZSk46w3DQskKfzHeH4icdddG6nC48hSSD56r4qZ'),
//     poolAddress: new PublicKey('C6nWZRHSHva5wdtgoYLmZF8zanVvcsAedUqwstzp699D'),
//     base: 'SOL',
//     quote: 'SRM',
//   },
// ]
