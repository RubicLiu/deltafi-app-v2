import { PublicKey } from '@solana/web3.js'

import { PoolSchema } from './pools'

export interface FarmPoolSchema extends PoolSchema {
  poolAddress: PublicKey
}

export const farmPools: FarmPoolSchema[] = [
  {
    name: 'SRM-USDC',
    address: new PublicKey('6RVdK5GK65HT7RJuSCBwzrrPwKmT4Fo5MBj5uRnMBBsS'),
    poolAddress: new PublicKey('HJrcEthNx8TGxJ6uTpxmumwDYbyNjJzjzcUvuXBmtY3P'),
    base: 'SRM',
    quote: 'USDC',
  },
]
