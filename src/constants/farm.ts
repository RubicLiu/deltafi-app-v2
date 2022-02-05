import { PublicKey } from '@solana/web3.js'

import { PoolSchema } from './pools'

export interface FarmPoolSchema {
  name: string
  address: PublicKey
  poolAddress: PublicKey
  base: string
  quote: string
}

export const farmPools: FarmPoolSchema[] = [
  {
    name: 'SRM-USDC',
    address: new PublicKey('6RVdK5GK65HT7RJuSCBwzrrPwKmT4Fo5MBj5uRnMBBsS'),
    poolAddress: new PublicKey('HJrcEthNx8TGxJ6uTpxmumwDYbyNjJzjzcUvuXBmtY3P'),
    base: 'SRM',
    quote: 'USDC',
  },
  
  {
    name: 'SOL - SRM',
    address: new PublicKey('AsnEmr6TrFDbd2qJKU9iBrjNWQJCKGWLVzyZEEp75gCd'),
    poolAddress: new PublicKey('8VvDYTxmcTc52q6NoQwCpHe9b82q7HLL6rZhpCJfqLpn'),
    base: 'SOL',
    quote: 'SRM',
  },
]
