import { createReducer, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, Connection, AccountInfo } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { blob, struct } from "buffer-layout";
import { deployConfig } from "constants/deployConfig";
import { lpTokens, tokens } from "constants/tokens";
import { Dispatch } from "react";
import { getMultipleAccounts } from "utils/account";
import { u64, publicKey } from "utils/layout";

type TokenAccountInfo = { accountPublicKey: PublicKey; balance: BigNumber; mint: PublicKey };
type MintToTokenAccountInfo = Record<string, TokenAccountInfo | null>;

export interface TokenAccountState {
  mintToTokenAccountInfo: MintToTokenAccountInfo | null;
}

const initialState: TokenAccountState = {
  mintToTokenAccountInfo: null,
};

type fetchTokenAccountsThunkArgs = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const setTokenAccountAction = createAction<{
  mint: string;
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

// helper function for swap/deposit/withdraw/unstake
// this is used by react components under view/ when they have confirmed a transaction
// and need to do a forced balance update
export async function fecthTokenAccountInfoList(
  mintAddressList: string[],
  wallet: PublicKey,
  connection: Connection,
  dispatch: Dispatch<any>,
) {
  const tokenAccountInfoList = await getTokenAcountInfoList(mintAddressList, connection, wallet);
  for (const tokenAccountInfo of tokenAccountInfoList) {
    console.info(tokenAccountInfo);
    dispatch(setTokenAccountAction({ mint: tokenAccountInfo.mint.toBase58(), tokenAccountInfo }));
  }
}

async function getTokenAccountAddress(mintAddress: String, wallet: PublicKey) {
  // For SOL native account, we use the wallet address directly.
  if (mintAddress === SOL_MINT_ADDRESS) {
    return wallet;
  }

  return Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(mintAddress),
    wallet,
  );
}

async function getTokenAcountInfoList(
  mintAddressList: string[],
  connection: Connection,
  walletAddress: PublicKey,
) {
  const tokenAddressList = [];
  for (const mintAddress of mintAddressList) {
    if (mintAddress) {
      tokenAddressList.push(await getTokenAccountAddress(mintAddress, walletAddress));
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
    const mintAddressList = tokens
      .map(({ address }) => address)
      .concat(lpTokens.map(({ address }) => address))
      .concat([deployConfig.deltafiTokenMint]);

    const tokenAccountInfoList = await getTokenAcountInfoList(
      mintAddressList,
      arg.connection,
      arg.walletAddress,
    );

    const mintToTokenAccountInfo = {};
    for (const tokenAccountInfo of tokenAccountInfoList) {
      mintToTokenAccountInfo[tokenAccountInfo.mint.toBase58()] = tokenAccountInfo;
    }
    console.info(mintToTokenAccountInfo);

    return {
      mintToTokenAccountInfo,
    };
  },
);

export const tokenAccountReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(fetchTokenAccountsThunk.fulfilled, (state, action) => {
      state.mintToTokenAccountInfo = action.payload.mintToTokenAccountInfo;
    })
    .addCase(setTokenAccountAction, (state, action) => {
      if (!state.mintToTokenAccountInfo) {
        state.mintToTokenAccountInfo = {};
      }
      state.mintToTokenAccountInfo[action.payload.mint] = action.payload.tokenAccountInfo;
    });
});
