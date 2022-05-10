import { Connection, PublicKey } from "@solana/web3.js";
import { mergeTransactions, partialSignTransaction } from ".";
import { deployConfigV2 } from "constants/deployConfigV2";
import { web3 } from "@project-serum/anchor";
import * as token from "@solana/spl-token";
import { DeltafiUser } from "anchor/type_definitions";
import { Transaction } from "@solana/web3.js";
import { createTokenAccountTransaction } from "utils/transactions";
import { DELTAFI_TOKEN_MINT } from "constants/index";

export async function createDeltafiUserTransaction(
  program: any,
  connection: Connection,
  walletPubkey: PublicKey,
) {
  const marketConfig = new PublicKey(deployConfigV2.marketConfig);
  const [deltafiUserPubkey, deltafiUserBump] = await PublicKey.findProgramAddress(
    [Buffer.from("User"), marketConfig.toBuffer(), walletPubkey.toBuffer()],
    program.programId,
  );

  const transaction = program.transaction.createDeltafiUser(deltafiUserBump, {
    accounts: {
      marketConfig,
      owner: walletPubkey,
      deltafiUser: deltafiUserPubkey,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    },
  });

  const signers = [];
  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}

export async function createClaimRewardsTransaction(
  program: any,
  connection: Connection,
  walletPubkey: PublicKey,
  userDeltafiToken: PublicKey,
) {
  const marketConfig = new PublicKey(deployConfigV2.marketConfig);
  const [deltafiUserPubkey, deltafiUserBump] = await PublicKey.findProgramAddress(
    [Buffer.from("User"), marketConfig.toBuffer(), walletPubkey.toBuffer()],
    program.programId,
  );

  let transactionCreateDeltafiTokenAccount: Transaction | undefined = undefined;
  let transactionCreateDeltafiUser: Transaction | undefined = undefined;

  // if deltafi token does not exist
  // we create it for the user
  if (!userDeltafiToken) {
    const createTokenAccountResult = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: new PublicKey(DELTAFI_TOKEN_MINT),
    });
    userDeltafiToken = createTokenAccountResult.newAccountPubkey;
    transactionCreateDeltafiTokenAccount = createTokenAccountResult.transaction;
  }

  const deltafiUser: DeltafiUser = await program.account.deltafiUser.fetchNullable(
    deltafiUserPubkey,
  );

  // if deltafi user account does not exist
  // we create it for the user
  if (!deltafiUser) {
    transactionCreateDeltafiUser = program.transaction.createDeltafiUser(deltafiUserBump, {
      accounts: {
        marketConfig,
        owner: walletPubkey,
        deltafiUser: deltafiUserPubkey,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
  }

  const transactionClaimRewards = program.transaction.claimSwapRewards({
    accounts: {
      marketConfig,
      deltafiUser: deltafiUserPubkey,
      userDeltafiToken,
      swapDeltafiToken: new PublicKey(deployConfigV2.deltafiToken),
      owner: walletPubkey,
      tokenProgram: token.TOKEN_PROGRAM_ID,
    },
  });

  return partialSignTransaction({
    transaction: mergeTransactions([
      transactionCreateDeltafiTokenAccount,
      transactionCreateDeltafiUser,
      transactionClaimRewards,
    ]),
    feePayer: walletPubkey,
    signers: [],
    connection,
  });
}
