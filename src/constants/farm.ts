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
    address: new PublicKey('9L2RDwmyr8gV7aYzRECFQGKCPJjHqeQr58RdjVQbExxo'),
    poolAddress: new PublicKey('Avkrs6DM5U7rgFtnzie7Fnux4TfEj911nJM3kSETh2Vb'),
    base: 'SRM',
    quote: 'USDC',
  },
  
  {
    name: 'SOL-SRM',
    address: new PublicKey('A5aeiYygNonQjZeNAbjqnLEx3VuBg4k1j4PjXjBbmpWW'),
    poolAddress: new PublicKey('Bk2kKrSZgPUeESW6Bkwi2xVsq5awi5aXreXo5HXCPEGW'),
    base: 'SOL',
    quote: 'SRM',
  },
]
