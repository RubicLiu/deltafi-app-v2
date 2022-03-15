import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { AccountInfo, PublicKey, Connection, Context } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import tuple from "immutable-tuple";
import { struct, blob } from "buffer-layout";
import { publicKey, u64 } from "utils/layout";
import { lpTokens, tokens } from "constants/tokens";
import { TokenAccount, TokenAccountInfo } from "./types";
import { useAsyncData } from "utils/fetch-loop";
import hash from "object-hash";

// Mock for testnet development
export function getTokenInfo(symbol: string) {
  return tokens.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase());
}

export function getFarmTokenInfo(symbol: string) {
  return lpTokens.find((token) => token.symbol.toLowerCase() === symbol?.toLowerCase());
}

export const TOKEN_ACCOUNT_LAYOUT = struct<TokenAccountInfo>([
  publicKey("mint"),
  publicKey("owner"),
  u64("amount"),
  blob(93),
]);

export function parseTokenAccountData(data: Buffer): {
  mint: PublicKey;
  owner: PublicKey;
  amount: BigNumber;
} {
  let { mint, owner, amount } = TOKEN_ACCOUNT_LAYOUT.decode(data);
  return {
    mint: new PublicKey(mint),
    owner: new PublicKey(owner),
    amount,
  };
}

export function getOwnedAccountsFilters(publicKey: PublicKey) {
  return [
    {
      memcmp: {
        offset: TOKEN_ACCOUNT_LAYOUT.offsetOf("owner"),
        bytes: publicKey.toBase58(),
      },
    },
    {
      dataSize: TOKEN_ACCOUNT_LAYOUT.span,
    },
  ];
}

export async function getOwnedTokenAccounts(
  connection: Connection,
  publicKey: PublicKey,
): Promise<Array<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }>> {
  let filters = getOwnedAccountsFilters(publicKey);

  const resp = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, { filters });

  return resp.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
    publicKey: new PublicKey(pubkey),
    accountInfo: {
      data,
      executable,
      owner: new PublicKey(owner),
      lamports,
    },
  }));
}

const defalutTokenAccountCacheLife: number = 60000; // 60,000ms
const tokenAccountCache: Record<
  string,
  {
    data: TokenAccount[];
    expiredTime: number;
    lastUpdate: number;
  }
> = {};

export function updateTokenAccountCache(
  tokenAccountPubkey: PublicKey,
  ownerAddress: PublicKey,
  tokenAccountInfo: AccountInfo<Buffer>,
): {
  mint: PublicKey;
  owner: PublicKey;
  amount: BigNumber;
} | null {
  const keyHash = hash.keys(ownerAddress.toBase58());
  if (!tokenAccountCache[keyHash]) {
    console.error("wrong token account owner");
    return null;
  }

  const tokenAccountIndex: number = tokenAccountCache[keyHash].data.findIndex(
    (t) => t.pubkey.toBase58() === tokenAccountPubkey.toBase58(),
  );
  if (tokenAccountIndex === -1) {
    console.error("cannot find token account", tokenAccountPubkey.toBase58());
    return null;
  }

  if (tokenAccountPubkey === ownerAddress) {
    tokenAccountInfo.data = Buffer.alloc(TOKEN_ACCOUNT_LAYOUT.span);
    TOKEN_ACCOUNT_LAYOUT.encode(
      {
        mint: NATIVE_MINT,
        owner: ownerAddress,
        amount: new BigNumber(tokenAccountInfo.lamports),
      },
      tokenAccountInfo.data,
    );

    tokenAccountCache[keyHash].data[tokenAccountIndex] = {
      pubkey: tokenAccountPubkey,
      account: tokenAccountInfo,
      effectiveMint: NATIVE_MINT,
    };
  } else {
    tokenAccountCache[keyHash].data[tokenAccountIndex] = {
      pubkey: tokenAccountPubkey,
      account: tokenAccountInfo,
      effectiveMint: parseTokenAccountData(tokenAccountInfo.data).mint,
    };

    tokenAccountCache[keyHash].lastUpdate = Date.now();
    return parseTokenAccountData(tokenAccountInfo.data);
  }
}

export async function getTokenAccountInfo(connection: Connection, ownerAddress: PublicKey) {
  const keyHash = hash.keys(ownerAddress.toBase58());

  if (tokenAccountCache[keyHash] && tokenAccountCache[keyHash].expiredTime > Date.now()) {
    return tokenAccountCache[keyHash].data;
  }

  let [splAccounts, account] = await Promise.all([
    getOwnedTokenAccounts(connection, ownerAddress),
    connection.getAccountInfo(ownerAddress),
  ]);
  const parsedSplAccounts: TokenAccount[] = splAccounts.map(({ publicKey, accountInfo }) => {
    return {
      pubkey: publicKey,
      account: accountInfo,
      effectiveMint: parseTokenAccountData(accountInfo.data).mint,
    };
  });
  // AccountInfo.data is empty for SPL, allocate buffer and encode it as a SOL token
  let balance = await connection.getBalance(ownerAddress);
  account.data = Buffer.alloc(TOKEN_ACCOUNT_LAYOUT.span);
  TOKEN_ACCOUNT_LAYOUT.encode(
    {
      mint: NATIVE_MINT,
      owner: ownerAddress,
      amount: new BigNumber(balance),
    },
    account.data,
  );

  const result = parsedSplAccounts.concat({
    pubkey: ownerAddress,
    account,
    effectiveMint: NATIVE_MINT,
  });

  for (const tokenAccount of result) {
    connection.onAccountChange(
      tokenAccount.pubkey,
      (tokenAccountInfo: AccountInfo<Buffer>, _: Context) =>
        updateTokenAccountCache(tokenAccount.pubkey, ownerAddress, tokenAccountInfo),
      "confirmed",
    );
  }

  tokenAccountCache[keyHash] = {
    data: result,
    expiredTime: Date.now() + defalutTokenAccountCacheLife,
    lastUpdate: Date.now(),
  };

  return result;
}

export function useTokenAccounts(): [TokenAccount[] | null | undefined, boolean] {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  async function getTokenAccounts() {
    if (!connected || !publicKey) {
      return null;
    }
    return getTokenAccountInfo(connection, publicKey);
  }
  return useAsyncData(getTokenAccounts, tuple("getTokenAccounts", publicKey, connected), {
    refreshInterval: 1000,
    refreshIntervalOnError: 5000,
  });
}

export function findTokenAccountByMint(
  tokens: TokenAccount[],
  walletPubkey: PublicKey,
  mintAddress: string,
): TokenAccount | null {
  const targetTokens = tokens.filter(
    (token) => token.effectiveMint.toBase58() === mintAddress && token.account,
  );

  if (!targetTokens || targetTokens.length === 0) {
    return null;
  }

  let targetToken: TokenAccount | null;
  if (mintAddress === NATIVE_MINT.toBase58()) {
    targetToken = targetTokens.filter((token) => token.pubkey === walletPubkey)[0] ?? null;
  } else {
    targetToken = targetTokens.reduce((a, b) => {
      const accountA = parseTokenAccountData(a.account.data);
      const accountB = parseTokenAccountData(b.account.data);
      if (accountA.amount > accountB.amount) {
        return a;
      }
      return b;
    });
  }

  return targetToken ?? null;
}

export function useTokenFromMint(mintAddress: string | null | undefined) {
  const [tokens] = useTokenAccounts();
  const { publicKey } = useWallet();

  const keyHash = publicKey ? hash.keys(publicKey.toBase58()) : null;
  const tokenAccountCacheLastUpdate = keyHash ? tokenAccountCache[keyHash]?.lastUpdate : null;

  return useMemo(() => {
    if (mintAddress && tokens) {
      const targetToken = findTokenAccountByMint(tokens, publicKey, mintAddress);

      if (!targetToken) {
        return null;
      }

      return {
        ...targetToken,
        account: parseTokenAccountData(targetToken.account.data),
      };
    }
    return null;
    /*eslint-disable */
  }, [mintAddress, tokens, publicKey, tokenAccountCacheLastUpdate]);
  /*eslint-enable */
}
