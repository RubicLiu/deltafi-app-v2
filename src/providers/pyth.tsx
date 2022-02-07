import { useEffect, useMemo, useState, createContext, useContext } from 'react'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { parseMappingData, parsePriceData, parseProductData, PriceData } from '@pythnetwork/client'
import { useConnection } from '@solana/wallet-adapter-react'

import { getMultipleAccounts } from 'utils/account'
import { PythContextValue } from './types'
import { ENDPOINTS, useCustomConnection } from './connection'

// TODO: update pyth pubkey
const oraclePublicKey = 'AHtgzX45WTKfkPG53L6WYhGEXwQkN1BVknET3sVsLL8J'

const BAD_SYMBOLS = ['BCH/USD', 'LTC/USD']

const PythContext: React.Context<null | PythContextValue> = createContext<null | PythContextValue>(null)

const createSetSymbolMapUpdater =
  (symbol: string, product: any, price: any, priceAccountKey: PublicKey) => (prev: any) =>
    !prev[symbol] || prev[symbol].price['validSlot'] < price.validSlot
      ? {
          ...prev,
          [symbol]: {
            product,
            price,
            priceAccountKey,
          },
        }
      : prev

const handlePriceInfo = (
  symbol: string,
  product: any,
  accountInfo: AccountInfo<Buffer> | null,
  setSymbolMap: Function,
  priceAccountKey: PublicKey,
) => {
  if (!accountInfo || !accountInfo.data) return
  const price = parsePriceData(accountInfo.data);
  setSymbolMap(createSetSymbolMapUpdater(symbol, product, price, priceAccountKey))
}

export function PythProvider({ children }) {
  const [filters, setFilters] = useState<null | string[]>(null)
  const [symbolMap, setSymbolMap] = useState<ISymbolMap>({})
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>()
  const [numProducts, setNumProducts] = useState(0)

  useEffect(() => {
    let cancelled = false
    const subscription_ids: number[] = []
    ;(async () => {
      // read mapping account
      const publicKey = new PublicKey(oraclePublicKey)
      try {
        const accountInfo = await connection.getAccountInfo(publicKey)
        if (cancelled) return
        if (!accountInfo || !accountInfo.data) {
          setIsLoading(false)
          return
        }
        const { productAccountKeys, nextMappingAccount } = parseMappingData(accountInfo.data)
        let allProductAccountKeys = [...productAccountKeys]
        let anotherMappingAccount = nextMappingAccount
        while (anotherMappingAccount) {
          const accountInfo = await connection.getAccountInfo(anotherMappingAccount)
          if (cancelled) return
          if (!accountInfo || !accountInfo.data) {
            anotherMappingAccount = null
          } else {
            const { productAccountKeys, nextMappingAccount } = parseMappingData(accountInfo.data)
            allProductAccountKeys = [...allProductAccountKeys, ...productAccountKeys]
            anotherMappingAccount = nextMappingAccount
          }
        }
        setIsLoading(false)
        setNumProducts(productAccountKeys.length)
        const productsInfos = await getMultipleAccounts(connection, productAccountKeys, 'confirmed')
        if (cancelled) return
        const productsData = productsInfos.array.map((p) => parseProductData(p.data as Buffer))
        const priceInfos = await getMultipleAccounts(
          connection,
          productsData.map((p) => p.priceAccountKey),
          'confirmed',
        )

        if (cancelled) return
        for (let i = 0; i < productsInfos.keys.length; i++) {
          // const key = productsInfos.keys[i]

          const productData = productsData[i]
          const product = productData.product
          const symbol = product['symbol']
          const priceAccountKey = productData.priceAccountKey
          const priceInfo = priceInfos.array[i]

          if ((!filters || filters.includes(symbol)) && !BAD_SYMBOLS.includes(symbol)) {
            handlePriceInfo(symbol, product, priceInfo as AccountInfo<Buffer>, setSymbolMap, priceAccountKey)

            subscription_ids.push(
              connection.onAccountChange(priceAccountKey, (accountInfo) => {
                handlePriceInfo(symbol, product, accountInfo, setSymbolMap, priceAccountKey)
              }),
            )
          }
        }
      } catch (e) {
        if (cancelled) return
        setError(e)
        setIsLoading(false)
        console.warn(`Failed to fetch mapping info for ${publicKey.toString()}`)
      }
    })()
    return () => {
      cancelled = true
      for (const subscription_id of subscription_ids) {
        connection.removeAccountChangeListener(subscription_id).catch(() => {
          console.warn(`Unsuccessfully attempted to remove listener for subscription id ${subscription_id}`)
        })
      }
    }
  }, [connection, filters])

  return (
    <PythContext.Provider value={{ symbolMap, setFilters, isLoading, numProducts, error }}>
      {children}
    </PythContext.Provider>
  )
}

interface ISymbolMap {
  [index: string]: object
}

export const usePyth = () => {
  const context = useContext(PythContext)
  if (!context) {
    throw new Error('Missing pyth context')
  }
  return context
}

export function usePriceBySymbol(tokenSymbol: string | null | undefined): {
  priceData: PriceData | null
  priceAccountKey: PublicKey | null
  price: number | null
} {
  const { symbolMap } = usePyth()
  const { network } = useCustomConnection()
  const isMainNet = useMemo(() => network === ENDPOINTS[0].name, [network])

  return useMemo(() => {
    let res = { priceData: null, priceAccountKey: null, price: null }
    if (!tokenSymbol) return res

    const symbol = `Crypto.${tokenSymbol}/USD`
    if (!symbolMap[symbol]) return res

    const priceData = (symbolMap[symbol] as any).price as PriceData
    res.priceData = priceData
    res.priceAccountKey = (symbolMap[symbol] as any).priceAccountKey as PublicKey
    res.price = priceData.price ? priceData.price : priceData.previousPrice

    return res
  }, [symbolMap, tokenSymbol, isMainNet])
}

function getPrice(accountInfo: AccountInfo<Buffer>) {
  if (!accountInfo || !accountInfo.data) return null
  const priceData = parsePriceData(accountInfo.data)
  return priceData.price ? priceData.price : priceData.previousPrice
}

export function usePriceByAddress(address: string | null | undefined) {
  const { connection } = useConnection()
  const [price, setPrice] = useState<null | number>(null)
  useEffect(() => {
    let subscription_id = null
    ;(async () => {
      if (!address) return
      const priceInfoKey = new PublicKey(address)
      try {
        const accountInfo = await connection.getAccountInfo(priceInfoKey)
        setPrice(getPrice(accountInfo))
        subscription_id = connection.onAccountChange(priceInfoKey, (accountInfo) => setPrice(getPrice(accountInfo)))
      } catch (e) {
        console.warn('failed to fetch price information for ', address)
      }
    })()

    return () => {
      if (subscription_id) {
        connection.removeAccountChangeListener(subscription_id).catch(() => {
          console.warn('failed to remove subscription for ', address)
        })
      }
    }
  }, [connection, address])

  return price
}

export default usePyth
