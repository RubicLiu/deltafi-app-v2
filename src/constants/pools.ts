import { PublicKey } from '@solana/web3.js'

const network = process.env.REACT_APP_NETWORK

export interface PoolSchema {
  name: string
  address: PublicKey
  mintAddress: PublicKey
  base: string
  quote: string
}

export const pools: PoolSchema[] = [
  {
    name: 'SOL-USDC',
    address: new PublicKey('Ac4JzVzC5WGU7froEinPBufRuXW29eBX9avDwhd4RiWQ'), 
    mintAddress: new PublicKey('FmLx5gR9Zkyu8hhAghg2Ps9Ypt44PVpxpPEHwNWS9p42'), 
    base: 'SOL',
    quote: 'USDC',
  },
  {
    name: 'SRM-USDC',
    address: new PublicKey('Avkrs6DM5U7rgFtnzie7Fnux4TfEj911nJM3kSETh2Vb'), 
    mintAddress: new PublicKey('HxbHSeDZiLv2AhyGmUbnsxdGVJQG1s2Fz6AXxTDxtE5a'), 
    base: 'SRM',
    quote: 'USDC',
  },
  {
    name: 'SOL-SRM',
    address: new PublicKey('Bk2kKrSZgPUeESW6Bkwi2xVsq5awi5aXreXo5HXCPEGW'),
    mintAddress: new PublicKey('Bk2kKrSZgPUeESW6Bkwi2xVsq5awi5aXreXo5HXCPEGW'),
    base: 'SOL',
    quote: 'SRM',
  },
]

export const listSymbols = (pools: PoolSchema[]) => {
  let list = []
  const prefix = 'Crypto.'
  pools.forEach((pool) => {
    if (!list.includes(`${prefix}${pool.base}/USD`)) {
      list.push(`${prefix}${pool.base}/USD`)
    }
    if (!list.includes(`${prefix}${pool.quote}/USD`)) {
      list.push(`${prefix}${pool.quote}/USD`)
    }
  })
  return list
}
