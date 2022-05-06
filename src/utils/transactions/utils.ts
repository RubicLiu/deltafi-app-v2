import {
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  Finality,
  TransactionResponse,
} from "@solana/web3.js";

import { AccountLayout, Token, TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { MARKET_CONFIG_ADDRESS, SWAP_PROGRAM_ID } from "constants/index";
import { TokenAccountInfo } from "states/accounts/tokenAccount";

export const dummyAddress = "66666666666666666666666666666666666666666666";

export function createNativeSOLHandlingTransactions(
  tempAccountRefPubkey: PublicKey,
  tmpAccountLamport: number,
  walletPubkey: PublicKey,
): {
  createWrappedTokenAccountTransaction: Transaction;
  initializeWrappedTokenAccountTransaction: Transaction;
  closeWrappedTokenAccountTransaction: Transaction;
} {
  const createWrappedTokenAccountTransaction = new Transaction();
  createWrappedTokenAccountTransaction.add(
    SystemProgram.createAccount({
      fromPubkey: walletPubkey,
      newAccountPubkey: tempAccountRefPubkey,
      lamports: tmpAccountLamport,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  const initializeWrappedTokenAccountTransaction = new Transaction();
  initializeWrappedTokenAccountTransaction.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      tempAccountRefPubkey,
      walletPubkey,
    ),
  );

  const closeWrappedTokenAccountTransaction = new Transaction();
  closeWrappedTokenAccountTransaction.add(
    Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      tempAccountRefPubkey,
      walletPubkey,
      walletPubkey,
      [],
    ),
  );

  return {
    createWrappedTokenAccountTransaction,
    initializeWrappedTokenAccountTransaction,
    closeWrappedTokenAccountTransaction,
  };
}

export async function getReferralDataAccountPublicKey(walletPublicKey: PublicKey) {
  const seed = ("referrer" + MARKET_CONFIG_ADDRESS.toBase58()).substring(0, 32);
  return PublicKey.createWithSeed(walletPublicKey, seed, SWAP_PROGRAM_ID);
}

function getTokenAccountBalanceDiff(
  transactionResult: TransactionResponse,
  tokenAccountInfo: TokenAccountInfo,
): number {
  if (!tokenAccountInfo.publicKey) {
    throw Error("null token account key");
  }

  const accountIndex = transactionResult.transaction.message.accountKeys.findIndex((accountKey) =>
    accountKey.equals(tokenAccountInfo.publicKey),
  );

  if (accountIndex < 0) {
    // the account index should be found from the two condition above
    // if it is not found, something went wrong with the transaction
    throw Error("cannot find token account from the result");
  }

  if (tokenAccountInfo.mint.equals(NATIVE_MINT)) {
    // if the specified 'token mint' is the SOL native mint
    // we use the native lamport as balance
    return (
      transactionResult.meta.postBalances[accountIndex] -
      transactionResult.meta.preBalances[accountIndex]
    );
  }

  // find token balances before and after the transaction
  const preTokenBalance = Number(
    transactionResult.meta.preTokenBalances.find(
      (tokenBalance) => tokenBalance.accountIndex === accountIndex,
      // it is possible that the token account does not exist before the transaction
      // and the result is null
      // in this case, the token account must be created during the transaction
      // and the pre token balance should be 0
    )?.uiTokenAmount.amount ?? 0,
  );
  const postTokenBalance = Number(
    transactionResult.meta.postTokenBalances.find(
      (tokenBalance) => tokenBalance.accountIndex === accountIndex,
    )?.uiTokenAmount.amount,
  );

  if (postTokenBalance === undefined) {
    // token account after the transaction must be found
    throw Error("cannot find token balance from the result");
  }

  return postTokenBalance - preTokenBalance;
}

export async function getTokenBalanceDiffFromTransaction(
  connection: Connection,
  signature: string,
  FromTokenAccountInfo: TokenAccountInfo,
  ToTokenAccountInfo: TokenAccountInfo,
  commitment: Finality = "confirmed",
) {
  const transactionResult = await connection.getTransaction(signature, { commitment });
  if (!transactionResult) {
    throw Error("invalid transaction signature" + signature);
  }

  return {
    fromTokenBalanceDiff: getTokenAccountBalanceDiff(transactionResult, FromTokenAccountInfo),
    toTokenBalanceDiff: getTokenAccountBalanceDiff(transactionResult, ToTokenAccountInfo),
  };
}
