import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { partialSignTransaction, mergeTransactions, createTokenAccountTransaction } from "..";
import * as token from "@solana/spl-token";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { web3, BN } from "@project-serum/anchor";

import { createApproveInstruction, SWAP_DIRECTION } from "lib/instructions";
import { AccountLayout } from "@solana/spl-token";
import { createNativeSOLHandlingTransactions } from "../utils";
import { SwapInfo, DeltafiUser } from "anchor/type_definitions";

export async function createSwapTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  swapInfo: SwapInfo,
  userSourceToken: PublicKey,
  userDestinationToken: PublicKey,
  walletPubkey: PublicKey,
  deltafiUser: DeltafiUser,
  referrer: PublicKey,
  swapDirection: SWAP_DIRECTION,
  inAmount: BN,
  minOutAmount: BN,
) {
  const tempAccountRefKeyPair = Keypair.generate();
  let createWrappedTokenAccountTransaction: Transaction | undefined;
  let initializeWrappedTokenAccountTransaction: Transaction | undefined;
  let closeWrappedTokenAccountTransaction: Transaction | undefined;

  const buySol =
    (poolConfig.quoteTokenInfo.symbol === "SOL" && swapDirection === SWAP_DIRECTION.SellBase) ||
    (poolConfig.baseTokenInfo.symbol === "SOL" && swapDirection === SWAP_DIRECTION.SellQuote);

  const sellSol =
    (poolConfig.quoteTokenInfo.symbol === "SOL" && swapDirection === SWAP_DIRECTION.SellQuote) ||
    (poolConfig.baseTokenInfo.symbol === "SOL" && swapDirection === SWAP_DIRECTION.SellBase);

  let userSourceTokenRef = userSourceToken;
  let userDestinationTokenRef = userDestinationToken;

  let createAccountsCost = 0;
  const createTokenAccountCost = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );
  if (buySol || sellSol) {
    let tmpAccountLamport = buySol
      ? createTokenAccountCost
      : inAmount.toNumber() + createTokenAccountCost;

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

    if (buySol) {
      userDestinationTokenRef = tempAccountRefKeyPair.publicKey;
    } else {
      userSourceTokenRef = tempAccountRefKeyPair.publicKey;
    }
  }

  const [swapSourceToken, swapDestinationToken, adminDestinationToken] =
    swapDirection === SWAP_DIRECTION.SellBase
      ? [swapInfo.tokenBase, swapInfo.tokenQuote, swapInfo.adminFeeTokenQuote]
      : [swapInfo.tokenQuote, swapInfo.tokenBase, swapInfo.adminFeeTokenBase];

  const userTransferAuthority = Keypair.generate();
  let transaction = new Transaction();
  transaction.add(
    createApproveInstruction(
      userSourceTokenRef,
      userTransferAuthority.publicKey,
      walletPubkey,
      BigInt(inAmount.toString()),
    ),
  );

  let createDestinationAccountTransaction: Transaction | undefined;
  if (!userDestinationTokenRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: new PublicKey(
        swapDirection === SWAP_DIRECTION.SellBase ? swapInfo.mintQuote : swapInfo.mintBase,
      ),
    });
    userDestinationTokenRef = result?.newAccountPubkey;
    createDestinationAccountTransaction = result?.transaction;
    createAccountsCost += createTokenAccountCost;
  }

  const marketConfig = new PublicKey(deployConfigV2.marketConfig);
  const [deltafiUserPubkey, deltafiUserBump] = await PublicKey.findProgramAddress(
    [Buffer.from("User"), marketConfig.toBuffer(), walletPubkey.toBuffer()],
    program.programId,
  );

  if (swapInfo.swapType.stableSwap) {
    transaction.add(
      program.transaction.stableSwap(inAmount, minOutAmount, {
        accounts: {
          marketConfig: new PublicKey(deployConfigV2.marketConfig),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          userSourceToken: userSourceTokenRef,
          userDestinationToken: userDestinationTokenRef,
          swapSourceToken,
          swapDestinationToken,
          deltafiUser: deltafiUserPubkey,
          adminDestinationToken,
          userAuthority: userTransferAuthority.publicKey,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        },
      }),
    );
  } else {
    transaction.add(
      program.transaction.normalSwap(inAmount, minOutAmount, {
        accounts: {
          marketConfig: new PublicKey(deployConfigV2.marketConfig),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          userSourceToken: userSourceTokenRef,
          userDestinationToken: userDestinationTokenRef,
          swapSourceToken,
          swapDestinationToken,
          pythPriceBase: swapInfo.pythPriceBase,
          pythPriceQuote: swapInfo.pythPriceQuote,
          deltafiUser: deltafiUserPubkey,
          adminDestinationToken,
          userAuthority: userTransferAuthority.publicKey,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        },
      }),
    );
  }

  const signers = [userTransferAuthority];

  if (!deltafiUser) {
    const createDeltafiUserTransaction = program.transaction.createDeltafiUser(deltafiUserBump, {
      accounts: {
        marketConfig: new PublicKey(deployConfigV2.marketConfig),
        owner: walletPubkey,
        deltafiUser: deltafiUserPubkey,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
    transaction = mergeTransactions([createDeltafiUserTransaction, transaction]);
  }

  if (buySol || sellSol) {
    transaction = mergeTransactions([
      createWrappedTokenAccountTransaction,
      initializeWrappedTokenAccountTransaction,
      createDestinationAccountTransaction,
      transaction,
      closeWrappedTokenAccountTransaction,
    ]);
    signers.push(tempAccountRefKeyPair);
  }

  return {
    transaction: await partialSignTransaction({
      transaction,
      feePayer: walletPubkey,
      signers,
      connection,
    }),
    createAccountsCost,
    userDestinationTokenRef,
  };
}
