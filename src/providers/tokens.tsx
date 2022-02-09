import { useEffect, useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import { AccountInfo, PublicKey, Connection } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, NATIVE_MINT, AccountLayout } from '@solana/spl-token'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import tuple from 'immutable-tuple'
import { u8, struct, blob } from 'buffer-layout'
import { publicKey, u64 } from 'utils/layout'
import { lpTokens, tokens } from 'constants/tokens'
import { useAccountInfo } from './connection'
import { MintInfo, TokenAccount, TokenAccountInfo } from './types'
import { useAsyncData } from 'utils/fetch-loop'
import hash from 'object-hash'

// Mock for testnet development
export function getTokenInfo(symbol: string) {
  return tokens.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase())
}

export function getFarmTokenInfo(symbol: string) {
  return lpTokens.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase())
}

export const ACCOUNT_LAYOUT = struct<TokenAccountInfo>([publicKey('mint'), publicKey('owner'), u64('amount'), blob(93)])

export const MINT_LAYOUT = struct<MintInfo>([blob(36), u64('supply'), u8('decimals'), u8('initialized'), blob(36)])

export function parseTokenAccountData(data: Buffer): { mint: PublicKey; owner: PublicKey; amount: BigNumber } {
  let { mint, owner, amount } = ACCOUNT_LAYOUT.decode(data)
  return {
    mint: new PublicKey(mint),
    owner: new PublicKey(owner),
    amount,
  }
}

export function parseTokenMintData(info: AccountInfo<Buffer>): MintInfo {
  let { decimals, initialized, supply } = MINT_LAYOUT.decode(info.data)
  return {
    decimals,
    initialized: !!initialized,
    supply: new BigNumber(supply),
  }
}

export function useTokenMintAccount(mint: PublicKey | null) {
  const [mintInfo] = useAccountInfo(mint)
  const [mintData, setMintData] = useState<null | MintInfo>(null)

  useEffect(() => {
    if (mintInfo) {
      setMintData(parseTokenMintData(mintInfo))
    }
  }, [mintInfo, setMintData])

  return mintData
}

export function getOwnedAccountsFilters(publicKey: PublicKey) {
  return [
    {
      memcmp: {
        offset: ACCOUNT_LAYOUT.offsetOf('owner'),
        bytes: publicKey.toBase58(),
      },
    },
    {
      dataSize: ACCOUNT_LAYOUT.span,
    },
  ]
}

const tokenAccountCache: Record<string, {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}[]> = {};

export async function getOwnedTokenAccounts(
  connection: Connection,
  publicKey: PublicKey,
): Promise<Array<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }>> {
  let filters = getOwnedAccountsFilters(publicKey)
  const keyHash = hash.keys({filters: filters, publicKey: publicKey});

  let resp = null;
  if (tokenAccountCache[keyHash]) {
    resp = tokenAccountCache[keyHash];
  }
  else {
    resp = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, { filters });
    tokenAccountCache[keyHash] = resp;
  }

  tokenAccountCache[keyHash] = resp;
  
  return resp.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
    publicKey: new PublicKey(pubkey),
    accountInfo: {
      data,
      executable,
      owner: new PublicKey(owner),
      lamports,
    },
  }))
}

export async function getTokenAccountInfo(connection: Connection, ownerAddress: PublicKey) {
  let [splAccounts, account] = await Promise.all([
    getOwnedTokenAccounts(connection, ownerAddress),
    connection.getAccountInfo(ownerAddress),
  ])
  const parsedSplAccounts: TokenAccount[] = splAccounts.map(({ publicKey, accountInfo }) => {
    return {
      pubkey: publicKey,
      account: accountInfo,
      effectiveMint: parseTokenAccountData(accountInfo.data).mint,
    }
  })
  // AccountInfo.data is empty for SPL, allocate buffer and encode it as a SOL token
  let balance = await connection.getBalance(ownerAddress);
  account.data = Buffer.alloc(ACCOUNT_LAYOUT.span);
  ACCOUNT_LAYOUT.encode(
    {
      mint: NATIVE_MINT,
      owner: ownerAddress,
      amount: new BigNumber(balance),
    },
    account.data,
  )

  return parsedSplAccounts.concat({
    pubkey: ownerAddress,
    account,
    effectiveMint: NATIVE_MINT,
  })
}

export function useTokenAccounts(): [TokenAccount[] | null | undefined, boolean] {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  async function getTokenAccounts() {
    if (!connected || !publicKey) {
      return null
    }
    return await getTokenAccountInfo(connection, publicKey)
  }
  return useAsyncData(getTokenAccounts, tuple('getTokenAccounts', publicKey, connected), { refreshInterval: 1000, refreshIntervalOnError: 5000 })
}

export function useTokenFromMint(mintAddress: string | null | undefined) {

  const [tokens] = useTokenAccounts()
  return useMemo(() => {
    
    if (mintAddress && tokens) {
      const targetTokens = tokens.filter(token => token.effectiveMint.toBase58() === mintAddress && token.account);

      if (!targetTokens || targetTokens.length === 0) {
        return null;
      }
      const targetToken = targetTokens.reduce((a, b) => {
        const accountA = parseTokenAccountData(a.account.data);
        const accountB = parseTokenAccountData(b.account.data);
        if (accountA.amount > accountB.amount) {
          return a;
        }
        return b;
      })
      
      return {
        ...targetToken, 
        account: parseTokenAccountData(targetToken.account.data)
      }
    }
    return null;

  }, [mintAddress, tokens])
}
