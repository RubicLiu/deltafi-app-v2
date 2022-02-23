import {
  PublicKey,
  Transaction,
  SystemProgram
} from "@solana/web3.js";

import { AccountLayout, Token, TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";

export function createNativeSOLHandlingTransactions(tempAccountRefPubkey: PublicKey, tmpAccountLamport: number, walletPubkey: PublicKey): {
  createWrappedTokenAccountTransaction: Transaction,
  initializeWrappedTokenAccountTransaction: Transaction,
  closeWrappedTokenAccountTransaction: Transaction,
} {
  const createWrappedTokenAccountTransaction = new Transaction();
  createWrappedTokenAccountTransaction
  .add(
    SystemProgram.createAccount({
      fromPubkey: walletPubkey,
      newAccountPubkey: tempAccountRefPubkey,
      lamports: tmpAccountLamport,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  const initializeWrappedTokenAccountTransaction = new Transaction();
  initializeWrappedTokenAccountTransaction
  .add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      tempAccountRefPubkey,
      walletPubkey,
    )
  );
  
  const closeWrappedTokenAccountTransaction = new Transaction();
  closeWrappedTokenAccountTransaction
  .add(
    Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      tempAccountRefPubkey,
      walletPubkey,
      walletPubkey,
      []
    )
  );

  return {
    createWrappedTokenAccountTransaction, 
    initializeWrappedTokenAccountTransaction, 
    closeWrappedTokenAccountTransaction
  };
}
