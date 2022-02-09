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
    address: new PublicKey('FRggPSFyyzgdEE7Dc4DBfZoi1z9bayAogHT2RpzjYpeQ'),
    poolAddress: new PublicKey('AorxH9q8oMR1di6r8dWKCiBMKgY8vGCodfV5rm3acHz3'),
    base: 'SRM',
    quote: 'USDC',
  },
  
  {
    name: 'SOL-SRM',
    address: new PublicKey('743hYJqTjc7DZYZqMS85nFAXwBb1GNHSF6Xhf4ZPdEPm'),
    poolAddress: new PublicKey('6MUGmm3BpA6NTCL83KrbSRFiEs53YhQ1etnMd3Y23HYp'),
    base: 'SOL',
    quote: 'SRM',
  },
]
