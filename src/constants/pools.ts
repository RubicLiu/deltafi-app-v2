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
    address: new PublicKey('C4wqSxdzFX5mFg8Uhk6tHZGmduRE3GsYMf9iQNEHrzp5'), 
    mintAddress: new PublicKey('5oaagwfJiWMKrTyWnu6iUVckJA7HDfLqeyrQVfa48Tkf'), 
    base: 'SOL',
    quote: 'USDC',
  },
  {
    name: 'SRM-USDC',
    address: new PublicKey('HJrcEthNx8TGxJ6uTpxmumwDYbyNjJzjzcUvuXBmtY3P'), 
    mintAddress: new PublicKey('23Hw8AY1LFMoTw8nWsGw5MXLCUghDDxX9yr8R7bWFaJc'), 
    base: 'SRM',
    quote: 'USDC',
  }
]

export const listSymbols = (pools: PoolSchema[]) => {
  let list = []
  const prefix = network === 'mainnet-beta' ? '' : 'Crypto.'
  pools.forEach((pool) => {
    if (!list.includes(pool.base)) {
      list.push(`${prefix}${pool.base}/USD`)
    }
    if (!list.includes(pool.quote)) {
      list.push(`${prefix}${pool.quote}/USD`)
    }
  })
  return list
}
