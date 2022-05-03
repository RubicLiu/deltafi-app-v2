import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { AccountLayout } from "@solana/spl-token";
import { partialSignTransaction, mergeTransactions } from "..";
import * as token from "@solana/spl-token";
import { PoolConfig } from "constants/deployConfigV2";
import { web3, BN } from "@project-serum/anchor";

import { createNativeSOLHandlingTransactions } from "../utils";
import { createApproveInstruction } from "lib/instructions";

export async function createDepositTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  swapInfo: any,
  userTokenBase: PublicKey,
  userTokenQuote: PublicKey,
  walletPubkey: PublicKey,
  lpUser: any,
  baseAmount: BN,
  qouteAmount: BN,
) {
  let baseSourceRef = userTokenBase;
  let quoteSourceRef = userTokenQuote;
  let createWrappedTokenAccountTransaction: Transaction | undefined;
  let initializeWrappedTokenAccountTransaction: Transaction | undefined;
  let closeWrappedTokenAccountTransaction: Transaction | undefined;

  const baseSOL = poolConfig.baseTokenInfo.symbol === "SOL";
  const quoteSOL = poolConfig.quoteTokenInfo.symbol === "SOL";
  const tempAccountRefKeyPair = Keypair.generate();
  const lamports = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

  if (baseSOL || quoteSOL) {
    const tmpAccountLamport = (baseSOL ? baseAmount.toNumber() : qouteAmount.toNumber()) + lamports;

    const nativeSOLHandlingTransactions = createNativeSOLHandlingTransactions(
      tempAccountRefKeyPair.publicKey,
      tmpAccountLamport,
      walletPubkey,
    );
    createWrappedTokenAccountTransaction =
      nativeSOLHandlingTransactions.createWrappedTokenAccountTransaction;
    initializeWrappedTokenAccountTransaction =
      nativeSOLHandlingTransactions.initializeWrappedTokenAccountTransaction;
    closeWrappedTokenAccountTransaction =
      nativeSOLHandlingTransactions.closeWrappedTokenAccountTransaction;

    if (baseSOL) {
      baseSourceRef = tempAccountRefKeyPair.publicKey;
    } else {
      quoteSourceRef = tempAccountRefKeyPair.publicKey;
    }
  }

  const [lpPublicKey, lpBump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("LiquidityProvider"),
      new PublicKey(poolConfig.swapInfo).toBuffer(),
      walletPubkey.toBuffer(),
    ],
    program.programId,
  );

  const userTransferAuthority = Keypair.generate();
  let transaction = new Transaction();
  transaction
    .add(
      createApproveInstruction(
        baseSourceRef,
        userTransferAuthority.publicKey,
        walletPubkey,
        BigInt(baseAmount.toString()),
      ),
    )
    .add(
      createApproveInstruction(
        quoteSourceRef,
        userTransferAuthority.publicKey,
        walletPubkey,
        BigInt(qouteAmount.toString()),
      ),
    );

  if (swapInfo.swapType.stableSwap) {
    transaction.add(
      program.transaction.depositToStableSwap(baseAmount, qouteAmount, {
        accounts: {
          swapInfo: new PublicKey(poolConfig.swapInfo),
          userTokenBase: baseSourceRef,
          userTokenQuote,
          quoteSourceRef,
          liquidityProvider: lpPublicKey,
          tokenBase: swapInfo.tokenBase,
          tokenQuote: swapInfo.tokenQuote,
          userAuthority: userTransferAuthority.publicKey,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        },
      }),
    );
  } else {
    transaction.add(
      program.transaction.depositToNormalSwap(baseAmount, qouteAmount, {
        accounts: {
          swapInfo: new PublicKey(poolConfig.swapInfo),
          userTokenBase: baseSourceRef,
          userTokenQuote,
          quoteSourceRef,
          liquidityProvider: lpPublicKey,
          tokenBase: swapInfo.tokenBase,
          tokenQuote: swapInfo.tokenQuote,
          pythPriceBase: swapInfo.pythPriceBase,
          pythPriceQuote: swapInfo.pythPriceQuote,
          userAuthority: userTransferAuthority.publicKey,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        },
      }),
    );
  }

  const signers = [userTransferAuthority];

  if (lpUser === null) {
    const createLpTransaction = program.transaction.createLiquidityProvider(lpBump, {
      accounts: {
        marketConfig: swapInfo.configKey,
        swapInfo: new PublicKey(poolConfig.swapInfo),
        liquidityProvider: lpPublicKey,
        owner: walletPubkey,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
    transaction = mergeTransactions([createLpTransaction, transaction]);
  }

  if (baseSOL || quoteSOL) {
    transaction = mergeTransactions([
      createWrappedTokenAccountTransaction,
      initializeWrappedTokenAccountTransaction,
      transaction,
      closeWrappedTokenAccountTransaction,
    ]);
    signers.push(tempAccountRefKeyPair);
  }

  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}
