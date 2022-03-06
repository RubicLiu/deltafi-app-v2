import { createContext, useState, useEffect, useContext } from "react";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

import { FarmPoolSchema } from "constants/farm";
import { FarmPoolInfo, FarmPoolsContextValues } from "./types";
import { getMultipleAccounts } from "utils/account";
import { parseFarmInfo, FARM_USER_SIZE } from "lib/state/farm";
import { getTokenInfo } from "./tokens";

const FarmPoolsContext = createContext<null | FarmPoolsContextValues>(null);

export function FarmPoolsProvider({ children }) {
  const [pools, setPools] = useState<FarmPoolInfo[]>([]);
  const [schemas, setSchemas] = useState<FarmPoolSchema[]>([]);
  const { connection } = useConnection();

  const updatePool = (pool: FarmPoolInfo) =>
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
          const farmInfos = await getMultipleAccounts(
            connection,
            schemas.map((s) => s.address),
            "confirmed",
          );
          const tempFarms = [];
          for (let i = 0; i < farmInfos.keys.length; i++) {
            let key = farmInfos.keys[i];
            let poolInfo = farmInfos.array[i];
            const schema = schemas.find((s) => s.address.equals(new PublicKey(key)));
            const { data } = parseFarmInfo(poolInfo as AccountInfo<Buffer>);
            tempFarms.push({
              name: schema.name,
              publicKey: new PublicKey(key),
              bumpSeed: data.bumpSeed,
              poolAddress: schema.poolAddress,
              poolMintKey: data.poolMint,
              poolToken: data.poolToken,
              baseTokenInfo: getTokenInfo(schema.base),
              quoteTokenInfo: getTokenInfo(schema.quote),
              reservedAmount: data.reservedAmount,
              aprNumerator: data.aprNumerator,
              aprDenominator: data.aprDenominator,
            });

            subscription_ids.push(
              connection.onAccountChange(new PublicKey(key), (accountInfo) => {
                const { data } = parseFarmInfo(accountInfo);
                updatePool({
                  name: schema.name,
                  publicKey: new PublicKey(key),
                  bumpSeed: data.bumpSeed,
                  poolAddress: schema.poolAddress,
                  poolMintKey: data.poolMint,
                  poolToken: data.poolToken,
                  baseTokenInfo: getTokenInfo(schema.base),
                  quoteTokenInfo: getTokenInfo(schema.quote),
                  reservedAmount: data.reservedAmount,
                  aprNumerator: data.aprNumerator,
                  aprDenominator: data.aprDenominator,
                });
              }),
            );
          }
          setPools(tempFarms);
        } catch (e) {
          console.error("Hey", e);
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

  return <FarmPoolsContext.Provider value={{ pools, schemas, setSchemas }}>{children}</FarmPoolsContext.Provider>;
}

export function useFarmPools() {
  const context = useContext(FarmPoolsContext);
  if (!context) {
    throw new Error("Missing farm pools context");
  }
  return context;
}

export function useFarmPoolByAddress(address: string | null | undefined) {
  const { pools } = useFarmPools();
  if (address && pools) {
    return pools.find((pool) => pool.publicKey.toBase58() === address);
  }
}

export function useFarmByPoolAddress(poolAddress: string | null | undefined) {
  const { pools, schemas } = useFarmPools();
  const schema = schemas.find((schema) => schema.poolAddress.toBase58() === poolAddress);
  if (schema && pools) return pools.find((pool) => pool.publicKey.equals(schema.address));
}

export function getStakeFilters(config: PublicKey, walletAddress: PublicKey) {
  return [
    {
      memcmp: {
        offset: 1,
        bytes: config.toBase58(),
      },
    },
    {
      memcmp: {
        // isInitialized + config key + farm pool key
        offset: 33 + 32,
        bytes: walletAddress.toBase58(),
      },
    },
    {
      dataSize: FARM_USER_SIZE,
    },
  ];
}
