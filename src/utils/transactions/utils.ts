import { PublicKey, Transaction, SystemProgram, Connection } from "@solana/web3.js";

import { AccountLayout, Token, TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { SWAP_PROGRAM_ID } from "constants/index";
import { MarketConfig } from "providers/types";
import { USER_REFERRER_DATA_SIZE } from "lib/state";
import { createSetReferrerInstruction } from "lib/instructions";
import { dummyReferrerAddress } from "./swap";

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
  const seed = "referrer";
  return PublicKey.createWithSeed(walletPublicKey, seed, SWAP_PROGRAM_ID);
}

export async function checkAndCreateReferralDataTransaction(
  walletPubkey: PublicKey,
  referrer: PublicKey | null,
  config: MarketConfig,
  connection: Connection,
  isNewUser: boolean,
): Promise<{
  userReferrerDataPubkey: PublicKey | null;
  createUserReferrerAccountTransaction: Transaction | null;
}> {
  const userReferrerDataPubkey = await getReferralDataAccountPublicKey(walletPubkey);

  const userReferralAccountInfo = await connection.getAccountInfo(userReferrerDataPubkey);
  if ((userReferralAccountInfo && isNewUser) || (!userReferralAccountInfo && !isNewUser)) {
    throw Error("Referral state is incorrect");
  }

  if (!isNewUser) {
    return {
      userReferrerDataPubkey,
      createUserReferrerAccountTransaction: undefined,
    };
  }

  const balanceForUserReferrerData = await connection.getMinimumBalanceForRentExemption(
    USER_REFERRER_DATA_SIZE,
  );

  const createUserReferrerAccountTransaction = new Transaction()
    .add(
      SystemProgram.createAccountWithSeed({
        basePubkey: walletPubkey,
        fromPubkey: walletPubkey,
        newAccountPubkey: userReferrerDataPubkey,
        lamports: balanceForUserReferrerData,
        space: USER_REFERRER_DATA_SIZE,
        programId: SWAP_PROGRAM_ID,
        seed: "referrer",
      }),
    )
    .add(
      createSetReferrerInstruction(
        config.publicKey,
        walletPubkey,
        userReferrerDataPubkey,
        referrer ? referrer : new PublicKey(dummyReferrerAddress),
        SWAP_PROGRAM_ID,
      ),
    );

  return {
    userReferrerDataPubkey,
    createUserReferrerAccountTransaction,
  };
}
