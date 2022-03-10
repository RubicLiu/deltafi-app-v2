import { createReducer, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, Connection, AccountInfo } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { blob, struct } from "buffer-layout";
import { deployConfig } from "constants/deployConfig";
import { DELTAFI_TOKEN_SYMBOL } from "constants/index";
import { lpTokens, tokens } from "constants/tokens";
import { Dispatch } from "react";
import { getMultipleAccounts } from "utils/account";
import { u64, publicKey } from "utils/layout";

type TokenAccountInfo = { accountPublicKey: PublicKey; balance: BigNumber; mint: PublicKey };
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

const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
export const TOKEN_ACCOUNT_LAYOUT = struct<{ mint: PublicKey; balance: BigNumber }>([
  publicKey("mint"),
  blob(32),
  u64("balance"),
  blob(93),
]);

function parseTokenAccountInfo(publicKey: PublicKey, accountInfo: AccountInfo<Buffer>) {
  const { balance, mint } = TOKEN_ACCOUNT_LAYOUT.decode(accountInfo.data);
  if (!accountInfo) {
    throw Error("invalid token account: " + publicKey.toBase58());
  }
  return {
    balance: new BigNumber(balance),
    accountPublicKey: publicKey,
    mint,
  };
}

function parseSolTokenAccountInfo(publicKey: PublicKey, accountInfo: AccountInfo<Buffer>) {
  if (!accountInfo) {
    throw Error("invalid wallet address: " + publicKey.toBase58());
  }
  return {
    balance: new BigNumber(accountInfo.lamports),
    accountPublicKey: publicKey,
    mint: new PublicKey(SOL_MINT_ADDRESS),
  };
}

async function getTokenAccountInfo(
  tokenAccountPublicKey: PublicKey,
  connection: Connection,
): Promise<TokenAccountInfo | null> {
  const tokenAccountInfoBuffer = await connection.getAccountInfo(tokenAccountPublicKey);
  return parseTokenAccountInfo(tokenAccountPublicKey, tokenAccountInfoBuffer);
}

async function getSolTokenAccountInfo(wallet: PublicKey, connection: Connection) {
  const walletAccountInfo = await connection.getAccountInfo(wallet);
  return parseSolTokenAccountInfo(wallet, walletAccountInfo);
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
    const tokenAccountInfo =
      symbol === "SOL"
        ? await getSolTokenAccountInfo(accountPublicKey, connection)
        : await getTokenAccountInfo(accountPublicKey, connection);
    dispatch(setTokenAccountAction({ symbol, tokenAccountInfo }));
  } catch (e) {
    console.warn(e);
  }
}

async function getTokenAcountInfoList(
  mintAddressList: string[],
  connection: Connection,
  walletAddress: PublicKey,
) {
  const tokenAddressList = [];
  for (const mintAddress of mintAddressList) {
    // For SOL native account, we use the wallet address directly.
    if (mintAddress === SOL_MINT_ADDRESS) {
      tokenAddressList.push(walletAddress);
    } else {
      const tokenAccountPublicKey = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(mintAddress),
        walletAddress,
      );
      tokenAddressList.push(tokenAccountPublicKey);
    }
  }

  const tokenAccountInfoList = [];
  const accountInfoList = await getMultipleAccounts(connection, tokenAddressList, "confirmed");
  for (let i = 0; i < accountInfoList.keys.length; i++) {
    const accountInfo = accountInfoList.array[i];
    const tokenAccountPublicKey = accountInfoList.keys[i];
    if (!accountInfo) {
      continue;
    }

    try {
      const tokenAccountInfo =
        tokenAccountPublicKey === walletAddress
          ? parseSolTokenAccountInfo(walletAddress, accountInfo as AccountInfo<Buffer>)
          : parseTokenAccountInfo(tokenAccountPublicKey, accountInfo as AccountInfo<Buffer>);
      tokenAccountInfoList.push(tokenAccountInfo);
    } catch (e) {
      // Ignore individual account error.
      console.warn(e);
    }
  }
  return tokenAccountInfoList;
}

// fetch token account based on the mint and wallet address
export const fetchTokenAccountsThunk = createAsyncThunk(
  "tokenAccount/fetchTokenAccountsThunk",
  async (arg: fetchTokenAccountsThunkArgs) => {
    // Get tokens, lp tokens and deltafi tokens.
    const addressToSymbol = Object.fromEntries(
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
    );

    const tokenAccountInfoList = await getTokenAcountInfoList(
      Object.keys(addressToSymbol),
      arg.connection,
      arg.walletAddress,
    );

    const symbolToTokenAccountInfo = Object.fromEntries(
      tokenAccountInfoList.map((tokenAccountInfo) => {
        const symbol = addressToSymbol[tokenAccountInfo.mint.toBase58()];
        return [symbol, tokenAccountInfo];
      }),
    );
    console.info(symbolToTokenAccountInfo);

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
