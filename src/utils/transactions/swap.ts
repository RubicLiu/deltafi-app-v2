import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

import { createNativeSOLHandlingTransactions } from "./utils";
import {
  createApproveInstruction,
  createSwapInstruction,
  SwapData,
  SWAP_DIRECTION,
  createSetReferrerInstruction,
} from "lib/instructions";
import { ExTokenAccount, MarketConfig, PoolInfo } from "providers/types";
import { USER_REFERRER_DATA_SIZE } from "lib/state";

import { SWAP_PROGRAM_ID } from "constants/index";
import { createTokenAccountTransaction, mergeTransactions, signTransaction } from ".";
import { AccountLayout } from "@solana/spl-token";

export async function swap({
  connection,
  walletPubkey,
  config,
  pool,
  source,
  destinationRef,
  rewardTokenRef,
  swapData,
  referrer,
}: {
  connection: Connection;
  walletPubkey: PublicKey;
  config: MarketConfig;
  pool: PoolInfo;
  source: ExTokenAccount;
  destinationRef?: PublicKey;
  rewardTokenRef?: PublicKey;
  swapData: SwapData;
  referrer?: PublicKey;
}) {
  if (!connection || !walletPubkey || !pool || !config || !source) {
    console.error("swap failed with null parameter");
    return null;
  }

  const lamports = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);
  const tempAccountRefKeyPair = Keypair.generate();
  let createWrappedTokenAccountTransaction: Transaction | undefined;
  let initializeWrappedTokenAccountTransaction: Transaction | undefined;
  let closeWrappedTokenAccountTransaction: Transaction | undefined;
  let createUserReferrerAccountTransaction: Transaction | undefined;
  let userReferrerDataPubkey: PublicKey | undefined;

  let buySol =
    (pool.quoteTokenInfo.symbol === "SOL" && swapData.swapDirection === SWAP_DIRECTION.SellBase) ||
    (pool.baseTokenInfo.symbol === "SOL" && swapData.swapDirection === SWAP_DIRECTION.SellQuote);

  let sellSol =
    (pool.quoteTokenInfo.symbol === "SOL" && swapData.swapDirection === SWAP_DIRECTION.SellQuote) ||
    (pool.baseTokenInfo.symbol === "SOL" && swapData.swapDirection === SWAP_DIRECTION.SellBase);

  let sourceRef: PublicKey = source.pubkey;

  if (buySol || sellSol) {
    let tmpAccountLamport = buySol ? lamports * 2 : Number(swapData.amountIn) + lamports * 2;

    const nativeSOLHandlingTransactions = createNativeSOLHandlingTransactions(
      tempAccountRefKeyPair.publicKey,
      tmpAccountLamport,
      walletPubkey,
    );
    createWrappedTokenAccountTransaction = nativeSOLHandlingTransactions.createWrappedTokenAccountTransaction;
    initializeWrappedTokenAccountTransaction = nativeSOLHandlingTransactions.initializeWrappedTokenAccountTransaction;
    closeWrappedTokenAccountTransaction = nativeSOLHandlingTransactions.closeWrappedTokenAccountTransaction;

    if (buySol) {
      destinationRef = tempAccountRefKeyPair.publicKey;
    } else {
      sourceRef = tempAccountRefKeyPair.publicKey;
    }
  }

  let createDestinationAccountTransaction: Transaction | undefined;
  if (!destinationRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: new PublicKey(
        pool.baseTokenInfo.address === source.account.mint.toString()
          ? pool.quoteTokenInfo.address
          : pool.baseTokenInfo.address,
      ),
    });
    destinationRef = result?.newAccountPubkey;
    createDestinationAccountTransaction = result?.transaction;
  }

  let createRewardAccountTransaction: Transaction | undefined;
  if (!rewardTokenRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: config.deltafiMint,
    });
    rewardTokenRef = result?.newAccountPubkey;
    createRewardAccountTransaction = result?.transaction;
  }

  // Only create user referrer data account for non-sol operation, because otherwise the transaction
  // will fail as the transaction payload is too big.
  if (referrer && !(buySol || sellSol)) {
    const seed = "referrer";
    userReferrerDataPubkey = await PublicKey.createWithSeed(walletPubkey, seed, SWAP_PROGRAM_ID);
    // TODO: Check if the user referrer data is created already.
    if (userReferrerDataPubkey == null) {
      const balanceForUserReferrerData = await connection.getMinimumBalanceForRentExemption(USER_REFERRER_DATA_SIZE);
      createUserReferrerAccountTransaction = new Transaction()
        .add(
          SystemProgram.createAccountWithSeed({
            basePubkey: walletPubkey,
            fromPubkey: walletPubkey,
            newAccountPubkey: userReferrerDataPubkey,
            lamports: balanceForUserReferrerData,
            space: USER_REFERRER_DATA_SIZE,
            programId: SWAP_PROGRAM_ID,
            seed,
          }),
        )
        .add(
          createSetReferrerInstruction(
            config.publicKey,
            walletPubkey,
            userReferrerDataPubkey,
            referrer,
            SWAP_PROGRAM_ID,
          ),
        );
    }
  }

  const userTransferAuthority = Keypair.generate();
  let nonce = new BN(config.bumpSeed);
  const marketAuthority = await PublicKey.createProgramAddress(
    [config.publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 1)],
    SWAP_PROGRAM_ID,
  );
  nonce = new BN(pool.nonce);
  const swapAuthority = await PublicKey.createProgramAddress(
    [pool.publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 1)],
    SWAP_PROGRAM_ID,
  );

  let [swapSource, swapDestination, adminFeeDestination] = (function () {
    if (swapData.swapDirection === SWAP_DIRECTION.SellBase) {
      return [pool.base, pool.quote, pool.quoteFee];
    } else {
      return [pool.quote, pool.base, pool.baseFee];
    }
  })();

  // TODO: Add the referrer info to the swap instruction.
  let transaction = new Transaction();
  transaction
    .add(createApproveInstruction(sourceRef, userTransferAuthority.publicKey, walletPubkey, swapData.amountIn))
    .add(
      createSwapInstruction(
        config.publicKey,
        pool.publicKey,
        marketAuthority,
        swapAuthority,
        userTransferAuthority.publicKey,
        sourceRef,
        swapSource,
        source.account.mint,
        swapDestination,
        destinationRef,
        new PublicKey(
          pool.baseTokenInfo.address === source.account.mint.toBase58()
            ? pool.quoteTokenInfo.address
            : pool.baseTokenInfo.address,
        ),
        rewardTokenRef,
        config.deltafiToken,
        adminFeeDestination,
        pool.pythBase,
        pool.pythQuote,
        swapData,
        SWAP_PROGRAM_ID,
        userReferrerDataPubkey,
        referrer,
      ),
    );

  transaction = mergeTransactions([
    createWrappedTokenAccountTransaction,
    initializeWrappedTokenAccountTransaction,
    createDestinationAccountTransaction,
    createRewardAccountTransaction,
    createUserReferrerAccountTransaction,
    transaction,
    closeWrappedTokenAccountTransaction,
  ]);
  if (buySol || sellSol) {
    return signTransaction({
      transaction,
      feePayer: walletPubkey,
      signers: [userTransferAuthority, tempAccountRefKeyPair],
      connection,
    });
  } else {
    return signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection });
  }
}
