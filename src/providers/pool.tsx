import React, { createContext, useState, useContext, useEffect } from "react";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

import { SWAP_PROGRAM_ID } from "constants/index";
import { PoolInfo, EntirePoolsContextValues } from "./types";
import { PoolSchema } from "constants/pools";
import { parseSwapInfo } from "lib/state";
import { getTokenInfo } from "./tokens";
import { getMultipleAccounts } from "utils/account";
import { loadAccount } from "utils/account";

const EntirePoolsContext: React.Context<null | EntirePoolsContextValues> =
  createContext<null | EntirePoolsContextValues>(null);

export const getPoolFromSwapInfoAccount = (schema, publicKey, poolInfo) => {
  const { data } = parseSwapInfo(poolInfo as AccountInfo<Buffer>);
  return {
    name: schema.name,
    swapType: data.swapType,
    publicKey: publicKey,
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
    schema: schema,
  };
};

export function EntirePoolsProvider({ children }) {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [schemas, setSchemas] = useState<PoolSchema[]>([]);
  const { connection } = useConnection();

  const updatePool = (pool: PoolInfo) =>
    setPools((pools) => {
      const poolIdx = pools.findIndex((p) => p.publicKey.toString() === pool.publicKey.toString());
      if (poolIdx === -1) {
        pools.push(pool);
      } else {
        pools[poolIdx] = pool;
      }
      return pools;
    });

  useEffect(() => {
    const subscription_ids: number[] = [];
    if (schemas.length > 0 && connection) {
      (async () => {
        try {
          const poolInfos = await getMultipleAccounts(
            connection,
            schemas.map((s) => s.address),
            "confirmed",
          );
          const tempPools = [];

          for (let i = 0; i < poolInfos.keys.length; i++) {
            const key = poolInfos.keys[i];
            const poolInfo = poolInfos.array[i];
            const publicKey = new PublicKey(key);
            const schema = schemas.find((s) => s.address.equals(publicKey));
            tempPools.push(getPoolFromSwapInfoAccount(schema, publicKey, poolInfo));

            subscription_ids.push(
              connection.onAccountChange(publicKey, (accountInfo) => {
                updatePool(getPoolFromSwapInfoAccount(schema, publicKey, accountInfo));
              }),
            );
          }
          setPools(tempPools);
        } catch (e) {
          console.error(e);
        }
      })();
    }
    return () => {
      for (const subscription_id of subscription_ids) {
        connection?.removeAccountChangeListener(subscription_id).catch(() => {
          console.warn(`Unsuccessfully attempted to remove listener for subscription id ${subscription_id}`);
        });
      }
    };
  }, [schemas, connection]);

  return <EntirePoolsContext.Provider value={{ pools, schemas, setSchemas }}>{children}</EntirePoolsContext.Provider>;
}

export function usePools() {
  const context = useContext(EntirePoolsContext);
  if (!context) {
    throw new Error("Missing pools context");
  }
  return context;
}

export function usePoolFromAddress(address: PublicKey): PoolInfo {
  const { pools } = usePools();
  if (address && pools) {
    return pools.find((p) => p.publicKey.equals(address));
  }
  return null;
}

export async function updatePoolFromAddress(connection, pools, address: PublicKey) {
  const poolIdx = pools.findIndex((p) => p.publicKey.toString() === address.toString());
  if (poolIdx === -1) {
    return null;
  }

  const oldPool = pools[poolIdx];
  const accountInfo = await loadAccount(connection, address, SWAP_PROGRAM_ID);
  pools[poolIdx] = getPoolFromSwapInfoAccount(oldPool.schema, address, accountInfo);
  return pools[poolIdx];
}

export function usePoolFromSymbols(base?: string, quote?: string) {
  const { pools } = usePools();
  if (pools.length > 0 && base && quote) {
    return pools.find(
      (s) =>
        (s.baseTokenInfo.symbol.toLowerCase() === base.toLowerCase() &&
          s.quoteTokenInfo.symbol.toLowerCase() === quote.toLowerCase()) ||
        (s.baseTokenInfo.symbol.toLowerCase() === quote.toLowerCase() &&
          s.quoteTokenInfo.symbol.toLowerCase() === base.toLowerCase()),
    );
  }
  return null;
}
