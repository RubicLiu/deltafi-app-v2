import { PublicKey } from '@solana/web3.js'

import { PoolSchema } from './pools'

export interface FarmPoolSchema extends PoolSchema {
  poolAddress: PublicKey
}

export const farmPools: FarmPoolSchema[] = [
  {
    name: 'SOL - SRM',
    address: new PublicKey('B2zhczNpXGqrnxyZ7CqpjhLXGngC9Pm6W9RwUxQmTf7y'),
    poolAddress: new PublicKey('C8HGj5NADAi12G2jwTc1Gzwyfm1ncCMv22um3Whqtuu8'),
    base: 'SOL',
    quote: 'SRM',
  },
]
