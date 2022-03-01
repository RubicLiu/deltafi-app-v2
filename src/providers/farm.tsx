import { createContext, useState, useEffect, useContext } from "react";
import { AccountInfo, PublicKey, Connection, Context } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import tuple from "immutable-tuple";

import { FarmPoolSchema } from "constants/farm";
import { FarmPoolInfo, FarmPoolsContextValues, StakeAccount } from "./types";
import { getMultipleAccounts, getFilteredProgramAccounts } from "utils/account";
import { parseFarmInfo, FARM_USER_SIZE, parseFarmUser, FarmPosition } from "lib/state/farm";
import { getTokenInfo } from "./tokens";
import { SWAP_PROGRAM_ID } from "constants/index";
import { useAsyncData } from "utils/fetch-loop";
import { useConfig } from "./config";
import hash from "object-hash";

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

const stakeAccountsCache: Record<
  string,
  {
    data: {
      publicKey: PublicKey;
      positions: {
        [key: string]: StakeAccount;
      };
    };
    expiredTime: number;
  }
> = {};

const defaultStakeAccountsCachLife: number = 60000; // 60,000

export function updateStakeAccountCache(
  walletPubkey: PublicKey,
  configPubkey: PublicKey,
  // this key is string because we only use it as a search key
  // in the pool positions, and the key in position field in StakeAccout is string
  farmPoolId: string,
  farmPoolPositionData: FarmPosition,
): StakeAccount | null {
  const stakeFilters = getStakeFilters(configPubkey, walletPubkey);
  const keyHash = hash.keys(JSON.stringify(stakeFilters));

  if (!stakeAccountsCache[keyHash] || !stakeAccountsCache[keyHash].data.positions[farmPoolId]) {
    console.error("farm pool position not found");
    return null;
  }

  const position: StakeAccount = {
    depositBalance: new BigNumber(farmPoolPositionData.depositedAmount.toString()),
    rewardsOwed: new BigNumber(farmPoolPositionData.rewardsOwed.toString()),
    rewardEstimated: new BigNumber(farmPoolPositionData.rewardsEstimated.toString()),
    lastUpdateTs: new BigNumber(farmPoolPositionData.lastUpdateTs.toString()),
    nextClaimTs: new BigNumber(farmPoolPositionData.nextClaimTs.toString()),
  };

  stakeAccountsCache[keyHash].data.positions[farmPoolId] = position;

  return position;
}

async function stakeProgramIdAccount(connection: Connection, stakeFilters: any) {
  const keyHash = hash.keys(JSON.stringify(stakeFilters));
  if (stakeAccountsCache[keyHash] && stakeAccountsCache[keyHash].expiredTime > Date.now()) {
    return stakeAccountsCache[keyHash].data;
  }

  const farmUserAccountInfos = await getFilteredProgramAccounts(connection, SWAP_PROGRAM_ID, stakeFilters);
  const filtered = farmUserAccountInfos
    .map(({ publicKey, accountInfo }) => ({ publicKey, farmUserInfo: parseFarmUser(accountInfo) }))
    .filter(({ farmUserInfo }) => !!farmUserInfo);

  if (filtered.length === 0) return null;

  const farmUserAddress = filtered[0].publicKey;
  const farmUserInfo = filtered[0].farmUserInfo.data;
  const positions: {
    [key: string]: StakeAccount;
  } = {};

  farmUserInfo.positions.forEach((position) => {
    const poolId = position.pool.toBase58();
    const depositBalance = new BigNumber(position.depositedAmount.toString());
    positions[poolId] = {
      depositBalance,
      rewardsOwed: new BigNumber(position.rewardsOwed.toString()),
      rewardEstimated: new BigNumber(position.rewardsEstimated.toString()),
      lastUpdateTs: new BigNumber(position.lastUpdateTs.toString()),
      nextClaimTs: new BigNumber(position.nextClaimTs.toString()),
    };
  });

  connection.onAccountChange(
    farmUserAddress,
    (farmUserAccountInfo: AccountInfo<Buffer>, _: Context) => {
      const { data: farmUserData } = parseFarmUser(farmUserAccountInfo);
      const updatedPositions: {
        [key: string]: StakeAccount;
      } = {};

      farmUserData.positions.forEach((position) => {
        const poolId = position.pool.toBase58();
        const depositBalance = new BigNumber(position.depositedAmount.toString());
        updatedPositions[poolId] = {
          depositBalance,
          rewardsOwed: new BigNumber(position.rewardsOwed.toString()),
          rewardEstimated: new BigNumber(position.rewardsEstimated.toString()),
          lastUpdateTs: new BigNumber(position.lastUpdateTs.toString()),
          nextClaimTs: new BigNumber(position.nextClaimTs.toString()),
        };
      });

      stakeAccountsCache[keyHash] = {
        data: { publicKey: farmUserAddress, positions: updatedPositions },
        expiredTime: stakeAccountsCache[keyHash].expiredTime,
      };
    },
    "confirmed",
  );

  stakeAccountsCache[keyHash] = {
    data: { publicKey: farmUserAddress, positions },
    expiredTime: Date.now() + defaultStakeAccountsCachLife,
  };
  return { publicKey: farmUserAddress, positions };
}

function getStakeFilters(config: PublicKey, walletAddress: PublicKey) {
  return [
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
  ];
}

async function getFarmUserAccount(connection: Connection, config: PublicKey, walletAddress: PublicKey) {
  const stakeFilters = getStakeFilters(config, walletAddress);
  return stakeProgramIdAccount(connection, stakeFilters);
}

export function useFarmUserAccount() {
  const { connected, publicKey } = useWallet();
  const { config } = useConfig();
  const { connection } = useConnection();
  async function getFarmUser() {
    if (!connected || !publicKey || !config) {
      return null;
    }
    return getFarmUserAccount(connection, config.publicKey, publicKey);
  }
  return useAsyncData(
    getFarmUser,
    tuple("getFarmUser", connection, config?.publicKey.toBase58(), publicKey?.toBase58()),
    {
      refreshInterval: 800,
      refreshIntervalOnError: 5000,
    },
  );
}
