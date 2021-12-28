import { createContext, useState, useEffect, useContext } from 'react'
import { PublicKey, Connection } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import BigNumber from 'bignumber.js'
import tuple from 'immutable-tuple'

import { FarmPoolSchema } from 'constants/farm'
import { FarmPoolInfo, FarmPoolsContextValues, StakeAccount } from './types'
import { getMultipleAccounts, getFilteredProgramAccounts } from 'utils/account'
import { parseFarmInfo, FARM_USER_SIZE, parseFarmUser } from 'lib/state/farm'
import { getTokenInfo } from './tokens'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { useAsyncData } from 'utils/fetch-loop'
import { useConfig } from './config'

const FarmPoolsContext = createContext<null | FarmPoolsContextValues>(null)

export function FarmPoolsProvider({ children }) {
  const [pools, setPools] = useState<FarmPoolInfo[]>([])
  const [schemas, setSchemas] = useState<FarmPoolSchema[]>([])
  const { connection } = useConnection()

  const updatePool = (pool: FarmPoolInfo) =>
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
          const farmInfos = await getMultipleAccounts(
            connection,
            schemas.map((s) => s.address),
            'confirmed',
          )
          const tempFarms = []
          for (let i = 0; i < farmInfos.keys.length; i++) {
            let key = farmInfos.keys[i]
            let poolInfo = farmInfos.array[i]
            const schema = schemas.find((s) => s.address.equals(new PublicKey(key)))
            const { data } = parseFarmInfo(poolInfo)
            tempFarms.push({
              name: schema.name,
              publicKey: new PublicKey(key),
              bumpSeed: data.bumpSeed,
              poolMintKey: data.poolMint,
              poolToken: data.poolToken,
              baseTokenInfo: getTokenInfo(schema.base),
              quoteTokenInfo: getTokenInfo(schema.quote),
              reservedAmount: data.reservedAmount,
              aprNumerator: data.aprNumerator,
              aprDenominator: data.aprDenominator,
            })

            subscription_ids.push(
              connection.onAccountChange(new PublicKey(key), (accountInfo) => {
                const { data } = parseFarmInfo(accountInfo)
                updatePool({
                  name: schema.name,
                  publicKey: new PublicKey(key),
                  bumpSeed: data.bumpSeed,
                  poolMintKey: data.poolMint,
                  poolToken: data.poolToken,
                  baseTokenInfo: getTokenInfo(schema.base),
                  quoteTokenInfo: getTokenInfo(schema.quote),
                  reservedAmount: data.reservedAmount,
                  aprNumerator: data.aprNumerator,
                  aprDenominator: data.aprDenominator,
                })
              }),
            )
          }
          setPools(tempFarms)
        } catch (e) {
          console.log('Hey', e)
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

  return <FarmPoolsContext.Provider value={{ pools, schemas, setSchemas }}>{children}</FarmPoolsContext.Provider>
}

export function useFarmPools() {
  const context = useContext(FarmPoolsContext)
  if (!context) {
    throw new Error('Missing farm pools context')
  }
  return context
}

export function useFarmPoolByAddress(address: string | null | undefined) {
  const { pools } = useFarmPools()
  if (address && pools) {
    return pools.find((pool) => pool.publicKey.toBase58() === address)
  }
}

async function stakeProgramIdAccount(connection: Connection, stakeFilters: any) {
  const farmUserAccountInfos = await getFilteredProgramAccounts(connection, SWAP_PROGRAM_ID, stakeFilters)
  const filtered = farmUserAccountInfos
    .map(({ publicKey, accountInfo }) => ({ publicKey, farmUserInfo: parseFarmUser(accountInfo) }))
    .filter(({ farmUserInfo }) => !!farmUserInfo)

  if (filtered.length === 0) return null

  const farmUserAddress = filtered[0].publicKey
  const farmUserInfo = filtered[0].farmUserInfo.data
  const positions: {
    [key: string]: StakeAccount
  } = {}

  farmUserInfo.positions.forEach((position) => {
    const poolId = position.pool.toBase58()
    const depositBalance = new BigNumber(position.depositedAmount.toString())
    positions[poolId] = {
      depositBalance,
      rewardDebt: new BigNumber(position.rewardsOwed.toString()),
      rewardEstimated: new BigNumber(position.rewardsEstimated.toString()),
    }
  })

  return { publicKey: farmUserAddress, positions }
}

async function getFarmUserAccount(connection: Connection, config: PublicKey, walletAddress: PublicKey) {
  const stakeFilters = [
    {
      memcmp: {
        offset: 1,
        bytes: config.toBase58(),
      },
    },
    {
      memcmp: {
        offset: 33,
        bytes: walletAddress.toBase58(),
      },
    },
    {
      dataSize: FARM_USER_SIZE,
    },
  ]

  return await stakeProgramIdAccount(connection, stakeFilters)
}

export function useFarmUserAccount() {
  const { connected, publicKey } = useWallet()
  const { config } = useConfig()
  const { connection } = useConnection()
  async function getFarmUser() {
    if (!connected || !publicKey || !config) {
      return null
    }
    return await getFarmUserAccount(connection, config.publicKey, publicKey)
  }
  return useAsyncData(
    getFarmUser,
    tuple('getFarmUser', connection, config?.publicKey.toBase58(), publicKey?.toBase58()),
    {
      refreshInterval: 5000,
    },
  )
}
