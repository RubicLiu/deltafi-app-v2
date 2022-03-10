import { createReducer, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, Connection } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { blob, struct } from "buffer-layout";
import { deployConfig } from "constants/deployConfig";
import { DELTAFI_TOKEN_SYMBOL } from "constants/index";
import { lpTokens, tokens } from "constants/tokens";
import { Dispatch } from "react";
import { getMultipleAccounts } from "utils/account";
import { u64 } from "utils/layout";

type TokenAccountInfo = { accountPublicKey: PublicKey; balance: BigNumber };
/// mapping from symbol to balance and account public key
type SymbolToTokenAccountInfo = Record<string, TokenAccountInfo | null>;

export interface TokenAccountState {
  symbolToTokenAccountInfo: SymbolToTokenAccountInfo | null;
}

const initialState: TokenAccountState = {
  symbolToTokenAccountInfo: null,
};

type fetchTokenAccountsThunkArgs = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const setTokenAccountAction = createAction<{
  symbol: string;
  tokenAccountInfo: TokenAccountInfo;
}>("tokenAccount/setTokenAccount");

export const TOKEN_ACCOUNT_LAYOUT = struct<{ balance: BigNumber }>([
  blob(64),
  u64("balance"),
  blob(93),
]);

async function getTokenAccountInfo(
  tokenAccountPublicKey: PublicKey,
  connection: Connection,
): Promise<TokenAccountInfo | null> {
  try {
    const tokenAccountInfoBuffer = await connection.getAccountInfo(tokenAccountPublicKey);
    if (!tokenAccountInfoBuffer) {
      return null;
    }

    const { balance } = TOKEN_ACCOUNT_LAYOUT.decode(tokenAccountInfoBuffer.data);

    return {
      balance: new BigNumber(balance),
      accountPublicKey: tokenAccountPublicKey,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

// helper function for swap/deposit/withdraw/unstake
// this is used by react components under view/ when they have confirmed a transaction
// and need to do a forced balance update
export async function fecthTokenAccountInfo(
  symbolToTokenAccountInfo: SymbolToTokenAccountInfo,
  symbol: string,
  connection: Connection,
  dispatch: Dispatch<any>,
) {
  if (!symbolToTokenAccountInfo || !symbolToTokenAccountInfo[symbol]) {
    console.error("Symbol", symbol, "does not exist");
    return;
  }

  const { accountPublicKey } = symbolToTokenAccountInfo[symbol];

  try {
    if (symbol === "SOL") {
      const walletAccountInfo = await connection.getAccountInfo(accountPublicKey);
      if (!walletAccountInfo) {
        throw Error("invalid wallet address");
      }

      dispatch(
        setTokenAccountAction({
          symbol,
          tokenAccountInfo: {
            balance: new BigNumber(walletAccountInfo.lamports),
            accountPublicKey,
          },
        }),
      );
    } else {
      const tokenAccountInfo = await getTokenAccountInfo(accountPublicKey, connection);
      if (!tokenAccountInfo) {
        throw Error("cannot find token account info");
      }

      dispatch(setTokenAccountAction({ symbol, tokenAccountInfo }));
    }
  } catch (e) {
    console.warn(e);
  }
}

// This function fetches token accounts info of tokens that are in the
// keys of mintAddressToSymbol to the tokenAccountInfoResult Object
async function getTokenAcountInfoRecord(
  mintAddressToSymbol: Record<string, string>,
  connection: Connection,
  walletAddress: PublicKey,
): Promise<SymbolToTokenAccountInfo> {
  const tokenAccountInfoResult: SymbolToTokenAccountInfo = {};
  const tokenAccountAddressToMintAddress: Record<string, string> = {};

  // list of public keys of token accounts
  // the key value is calculated from mint address and wallet public key using
  // the official method
  const PublicKeyList = await Promise.all(
    Object.keys(mintAddressToSymbol).map(async (mintAddress) => {
      if (mintAddressToSymbol[mintAddress] === "SOL") {
        // if the token is SOL, we save the native SOL information in the form of a token account
        // the 'token account' address is the wallet itself
        tokenAccountAddressToMintAddress[walletAddress.toBase58()] = mintAddress;
        return walletAddress;
      }

      // this is where we get the the token accounts' public keys
      const tokenAccountPublicKey = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(mintAddress),
        walletAddress,
      );

      // need to save the mapping from token account public key to mint address for later processing
      tokenAccountAddressToMintAddress[tokenAccountPublicKey.toBase58()] = mintAddress;
      return tokenAccountPublicKey;
    }),
  );

  const accountInfoList = await getMultipleAccounts(connection, PublicKeyList, "confirmed");
  for (let i = 0; i < accountInfoList.keys.length; i++) {
    const accountInfo = accountInfoList.array[i];
    const tokenAccountPublicKey = accountInfoList.keys[i];
    // get which token this token account is associated with
    const symbol =
      mintAddressToSymbol[tokenAccountAddressToMintAddress[tokenAccountPublicKey.toBase58()]];

    if (!accountInfo) {
      // if there the account doesn't exist, we explicitly mark it as null
      tokenAccountInfoResult[symbol] = null;
      continue;
    }

    if (symbol === "SOL") {
      // for native sol, we also put its info in the form of a token account
      try {
        const walletAccountBalance = accountInfo.lamports;
        if (!walletAccountBalance) {
          // if the account info doesn't have lamport, it means there is something
          // wrong with the wallet address, this shouldn't happend
          throw Error("Invalid wallet address");
        }

        tokenAccountInfoResult.SOL = {
          accountPublicKey: walletAddress,
          balance: new BigNumber(walletAccountBalance),
        };
      } finally {
        // will foward any exeption upward, and keep processing next token in the loop
        continue;
      }
    }

    try {
      const { balance } = TOKEN_ACCOUNT_LAYOUT.decode(accountInfo.data as Buffer);

      tokenAccountInfoResult[symbol] = {
        accountPublicKey: tokenAccountPublicKey,
        // the original balance is a BigNumber from BitInt,
        // it needs to be converted again
        balance: new BigNumber(balance),
      };
    } finally {
      // will foward any exeption upward, and keep processing next token in the loop
      continue;
    }
  }

  return tokenAccountInfoResult;
}

// fetch token account based on the mint and wallet address
export const fetchTokenAccountsThunk = createAsyncThunk(
  "tokenAccount/fetchTokenAccountsThunk",
  async (arg: fetchTokenAccountsThunkArgs) => {
    // process both tokens and lp tokens
    // tokens and lptokens have to common field symbol, address

    const symbolToTokenAccountInfo = await getTokenAcountInfoRecord(
      // this object concats tokens, lptokens and deltafi token information together
      // and only take symbol and address fields
      Object.fromEntries(
        tokens
          .map(({ symbol, address }) => ({ symbol, address }))
          .concat(lpTokens.map(({ symbol, address }) => ({ symbol, address })))
          .concat([
            {
              symbol: DELTAFI_TOKEN_SYMBOL,
              address: deployConfig.deltafiTokenMint,
            },
          ])
          .map(({ symbol, address }) => [address, symbol]),
      ),
      arg.connection,
      arg.walletAddress,
    );

    return {
      symbolToTokenAccountInfo,
    };
  },
);

export const tokenAccountReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(fetchTokenAccountsThunk.fulfilled, (state, action) => {
      state.symbolToTokenAccountInfo = action.payload.symbolToTokenAccountInfo;
    })
    .addCase(setTokenAccountAction, (state, action) => {
      if (!state.symbolToTokenAccountInfo) {
        state.symbolToTokenAccountInfo = {};
      }
      state.symbolToTokenAccountInfo[action.payload.symbol] = action.payload.tokenAccountInfo;
    });
});
