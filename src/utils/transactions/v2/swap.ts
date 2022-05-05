import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { partialSignTransaction, mergeTransactions } from "..";
import * as token from "@solana/spl-token";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { web3, BN } from "@project-serum/anchor";

import { createApproveInstruction, SWAP_DIRECTION } from "lib/instructions";

export async function createSwapTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  swapInfo: any,
  userSourceToken: PublicKey,
  userDestinationToken: PublicKey,
  walletPubkey: PublicKey,
  deltafiUser: any,
  swapDirection: SWAP_DIRECTION,
  inAmount: BN,
  minOutAmount: BN,
) {
  const [swapSourceToken, swapDestinationToken, adminDestinationToken] =
    swapDirection === SWAP_DIRECTION.SellBase
      ? [swapInfo.tokenBase, swapInfo.tokenQuote, swapInfo.adminFeeTokenQuote]
      : [swapInfo.tokenQuote, swapInfo.tokenBase, swapInfo.adminFeeTokenBase];

  const userTransferAuthority = Keypair.generate();
  let transaction = new Transaction();
  transaction.add(
    createApproveInstruction(
      userSourceToken,
      userTransferAuthority.publicKey,
      walletPubkey,
      BigInt(inAmount.toString()),
    ),
  );

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
          userSourceToken: userSourceToken,
          userDestinationToken: userDestinationToken,
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
          userSourceToken: userSourceToken,
          userDestinationToken: userDestinationToken,
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

  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}
