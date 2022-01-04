import { PublicKey } from '@solana/web3.js'

import { PoolSchema } from './pools'

export interface FarmPoolSchema extends PoolSchema {
  poolAddress: PublicKey
}

export const farmPools: FarmPoolSchema[] = [
  {
    name: 'SOL - SRM',
    address: new PublicKey('G546mBfXM3r7JGmwL13rSBixZsBzqMHNoMNp4xxaQhze'),
    poolAddress: new PublicKey('EdJu4CF21nGmi21Yyu4tK7JfVn7XxKJEekCJF5UafJNJ'),
    base: 'SOL',
    quote: 'SRM',
  },
]
