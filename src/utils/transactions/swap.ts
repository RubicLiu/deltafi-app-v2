import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { partialSignTransaction, mergeTransactions, createTokenAccountTransaction } from ".";
import * as token from "@solana/spl-token";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { web3, BN } from "@project-serum/anchor";

import { createApproveInstruction, SWAP_DIRECTION } from "lib/instructions";
import { AccountLayout } from "@solana/spl-token";
import { createNativeSOLHandlingTransactions } from "./utils";
import { SwapInfo, DeltafiUser } from "anchor/type_definitions";

const ZERO_ADDRESS = "11111111111111111111111111111111";

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

  const hasReferrer = referrer != null && referrer.toBase58() !== ZERO_ADDRESS;
  const marketConfig = new PublicKey(deployConfigV2.marketConfig);
  const [deltafiUserPubkey, deltafiUserBump] = await PublicKey.findProgramAddress(
    [Buffer.from("User"), marketConfig.toBuffer(), walletPubkey.toBuffer()],
    program.programId,
  );

  const swapAccounts = {
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
  };

  if (swapInfo.swapType.stableSwap) {
    transaction.add(
      hasReferrer
        ? program.transaction.stableSwapWithReferrer(inAmount, minOutAmount, {
            accounts: swapAccounts,
            referrer,
          })
        : program.transaction.stableSwap(inAmount, minOutAmount, {
            accounts: swapAccounts,
          }),
    );
  } else {
    transaction.add(
      hasReferrer
        ? program.transaction.normalSwapWithReferrer(inAmount, minOutAmount, {
            accounts: {
              ...swapAccounts,
              pythPriceBase: swapInfo.pythPriceBase,
              pythPriceQuote: swapInfo.pythPriceQuote,
              referrer,
            },
          })
        : program.transaction.normalSwap(inAmount, minOutAmount, {
            accounts: {
              ...swapAccounts,
              pythPriceBase: swapInfo.pythPriceBase,
              pythPriceQuote: swapInfo.pythPriceQuote,
            },
          }),
    );
  }

  if (!deltafiUser) {
    const accounts = {
      marketConfig: new PublicKey(deployConfigV2.marketConfig),
      owner: walletPubkey,
      deltafiUser: deltafiUserPubkey,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    };
    const createDeltafiUserTransaction = hasReferrer
      ? program.transaction.createDeltafiUserWithReferrer(deltafiUserBump, {
          accounts: {
            ...accounts,
            referrer: referrer,
          },
        })
      : program.transaction.createDeltafiUser(deltafiUserBump, {
          accounts: accounts,
        });
    transaction = mergeTransactions([createDeltafiUserTransaction, transaction]);
  }

  const signers = [userTransferAuthority];
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
