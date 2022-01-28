import React, { createContext, useState, useContext, useEffect, useMemo } from 'react'
import { AccountInfo, PublicKey } from '@solana/web3.js'

import { PoolInfo, EntirePoolsContextValues } from './types'
import { PoolSchema } from 'constants/pools'
import { parseSwapInfo } from 'lib/state'
import { getTokenInfo } from './tokens'
import { getMultipleAccounts } from 'utils/account'
import { useConnection } from '@solana/wallet-adapter-react'

const EntirePoolsContext: React.Context<null | EntirePoolsContextValues> =
  createContext<null | EntirePoolsContextValues>(null)

export function EntirePoolsProvider({ children }) {
  const [pools, setPools] = useState<PoolInfo[]>([])
  const [schemas, setSchemas] = useState<PoolSchema[]>([])
  const { connection } = useConnection()

  const updatePool = (pool: PoolInfo) =>
    setPools((pools) => {
      const poolIdx = pools.findIndex((p) => p.publicKey.toString() === pool.publicKey.toString())
      if (poolIdx === -1) {
        pools.push(pool)
      } else {
        pools[poolIdx] = pool
      }
      return pools
    })

  useEffect(() => {
    const subscription_ids: number[] = []
    if (schemas.length > 0 && connection) {
      ;(async () => {
        try {
          const poolInfos = await getMultipleAccounts(
            connection,
            schemas.map((s) => s.address),
            'confirmed',
          )
          const tempPools = []
          
          

          for (let i = 0; i < poolInfos.keys.length; i++) {
            let key = poolInfos.keys[i]
            let poolInfo = poolInfos.array[i]
            const schema = schemas.find((s) => s.address.equals(new PublicKey(key)))
            const { data } = parseSwapInfo(poolInfo as AccountInfo<Buffer>)
            tempPools.push({
              name: schema.name,
              publicKey: new PublicKey(key),
              nonce: data.nonce,
              isPaused: data.isPaused,
              baseTokenInfo: getTokenInfo(schema.base),
              quoteTokenInfo: getTokenInfo(schema.quote),
              base: data.tokenA,
              quote: data.tokenB,
              pythBase: data.pythA,
              pythQuote: data.pythB,
              poolMintKey: data.poolMint,
              baseFee: data.adminFeeKeyA,
              quoteFee: data.adminFeeKeyB,
              fees: data.fees,
              rewards: data.rewards,
              poolState: data.poolState,
            })

            subscription_ids.push(
              connection.onAccountChange(new PublicKey(key), (accountInfo) => {
                const { data } = parseSwapInfo(accountInfo)
                updatePool({
                  name: schema.name,
                  publicKey: new PublicKey(key),
                  nonce: data.nonce,
                  isPaused: data.isPaused,
                  baseTokenInfo: getTokenInfo(schema.base),
                  quoteTokenInfo: getTokenInfo(schema.quote),
                  base: data.tokenA,
                  quote: data.tokenB,
                  pythBase: data.pythA,
                  pythQuote: data.pythB,
                  poolMintKey: data.poolMint,
                  baseFee: data.adminFeeKeyA,
                  quoteFee: data.adminFeeKeyB,
                  fees: data.fees,
                  rewards: data.rewards,
                  poolState: data.poolState,
                })
              }),
            )
          }
          setPools(tempPools)
        } catch (e) {
          console.log(e)
        }
      })()
    }
    return () => {
      for (const subscription_id of subscription_ids) {
        connection?.removeAccountChangeListener(subscription_id).catch(() => {
          console.warn(`Unsuccessfully attempted to remove listener for subscription id ${subscription_id}`)
        })
      }
    }
  }, [schemas, connection])

  return <EntirePoolsContext.Provider value={{ pools, schemas, setSchemas }}>{children}</EntirePoolsContext.Provider>
}

export function usePools() {
  const context = useContext(EntirePoolsContext)
  if (!context) {
    throw new Error('Missing pools context')
  }
  return context
}

export function usePoolFromAddress(address: PublicKey) {
  const { pools } = usePools()
  if (address && pools) {
    return pools.find((p) => p.publicKey.equals(address))
  }
  return null
}

export function usePoolFromSymbols(base?: string, quote?: string) {
  const { pools } = usePools()
  return useMemo(() => {
    if (pools.length > 0 && base && quote) {
      return pools.find(
        (s) =>
          (s.baseTokenInfo.symbol.toLowerCase() === base.toLowerCase() &&
            s.quoteTokenInfo.symbol.toLowerCase() === quote.toLowerCase()) ||
          (s.baseTokenInfo.symbol.toLowerCase() === quote.toLowerCase() &&
            s.quoteTokenInfo.symbol.toLowerCase() === base.toLowerCase()),
      )
    }
    return null
  }, [pools, base, quote])
}
