import React, { useContext, useEffect, useRef } from 'react'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { ConnectionProvider, useConnection } from '@solana/wallet-adapter-react'
import tuple from 'immutable-tuple'
import { useLocalStorageState } from '../utils/utils'
import { setCache, useAsyncData } from '../utils/fetch-loop'
import { ConnectionContextValues, EndpointInfo } from './types'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet-beta',
    endpoint: 'https://api.mainnet-beta.solana.com',
    custom: false,
  },
  { name: 'testnet', endpoint: 'https://api.testnet.solana.com', custom: false },
]

const accountListenerCount = new Map()

const ConnectionContext: React.Context<null | ConnectionContextValues> =
  React.createContext<null | ConnectionContextValues>(null)

export function CustomConnectionProvider({ children }) {
  const [endpoint, setEndpoint] = useLocalStorageState<string>('connectionEndpts', ENDPOINTS[0].endpoint)
  const [network, setNetwork] = useLocalStorageState<string>('network', ENDPOINTS[0].name)

  const handleSetNetwork = (network: string) => {
    const endpoint = ENDPOINTS.find((e) => e.name === network)
    setNetwork(endpoint.name)
    setEndpoint(endpoint.endpoint)
  }

  return (
    <ConnectionContext.Provider value={{ endpoint, network, setNetwork: handleSetNetwork }}>
      <ConnectionProvider endpoint={endpoint}>{children}</ConnectionProvider>
    </ConnectionContext.Provider>
  )
}

export function useCustomConnection() {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('Missing connection context')
  }
  return context
}

export function useAccountInfo(
  publicKey: PublicKey | undefined | null,
): [AccountInfo<Buffer> | null | undefined, boolean] {
  const { connection } = useConnection()
  const cacheKey = tuple(connection, publicKey?.toBase58())
  const [accountInfo, loaded] = useAsyncData<AccountInfo<Buffer> | null>(
    async () => (publicKey ? connection.getAccountInfo(publicKey) : null),
    cacheKey,
    { refreshInterval: 60_000 },
  )
  useEffect(() => {
    if (!publicKey) {
      return
    }
    if (accountListenerCount.has(cacheKey)) {
      let currentItem = accountListenerCount.get(cacheKey)
      ++currentItem.count
    } else {
      let previousInfo: AccountInfo<Buffer> | null = null
      const subscriptionId = connection.onAccountChange(publicKey, (info) => {
        if (!previousInfo || !previousInfo.data.equals(info.data) || previousInfo.lamports !== info.lamports) {
          previousInfo = info
          setCache(cacheKey, info)
        }
      })
      accountListenerCount.set(cacheKey, { count: 1, subscriptionId })
    }
    return () => {
      let currentItem = accountListenerCount.get(cacheKey)
      let nextCount = currentItem.count - 1
      if (nextCount <= 0) {
        connection.removeAccountChangeListener(currentItem.subscriptionId)
        accountListenerCount.delete(cacheKey)
      } else {
        --currentItem.count
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])
  const previousInfoRef = useRef<AccountInfo<Buffer> | null | undefined>(null)
  if (
    !accountInfo ||
    !previousInfoRef.current ||
    !previousInfoRef.current.data.equals(accountInfo.data) ||
    previousInfoRef.current.lamports !== accountInfo.lamports
  ) {
    previousInfoRef.current = accountInfo
  }
  return [previousInfoRef.current, loaded]
}

export function useAccountData(publicKey) {
  const [accountInfo] = useAccountInfo(publicKey)
  return accountInfo && accountInfo.data
}
