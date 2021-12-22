import { PublicKey } from '@solana/web3.js'

import { PoolSchema } from './pools'

export interface FarmPoolSchema extends PoolSchema {
  poolAddress: PublicKey
}

export const farmPools: FarmPoolSchema[] = [
  {
    name: 'SOL - SRM',
    address: new PublicKey('GUG8pqps3JWNMFFSPNphsMPKoP2proLuhn7mnyqjHEvv'),
    poolAddress: new PublicKey('4Vq3b8KV6mnL8egijJ4SV9fQxzQivRuTHAs1dmTfhVDH'),
    base: 'SOL',
    quote: 'SRM',
  },
]
