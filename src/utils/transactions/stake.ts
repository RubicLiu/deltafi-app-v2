import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createTokenAccountTransaction, mergeTransactions, partialSignTransaction } from ".";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { BN } from "@project-serum/anchor";
import * as token from "@solana/spl-token";
import { LiquidityProvider } from "anchor/type_definitions";
import { DELTAFI_TOKEN_MINT } from "constants/index";

export async function createUpdateStakeTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  walletPubkey: PublicKey,
  lpUser: LiquidityProvider,
  targetBaseAmount: BN,
  targetQuoteAmount: BN,
) {
  const [lpPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("LiquidityProvider"),
      new PublicKey(poolConfig.swapInfo).toBuffer(),
      walletPubkey.toBuffer(),
    ],
    program.programId,
  );

  let transaction = new Transaction();

  const baseDiff = targetBaseAmount.sub(lpUser.basePosition.depositedAmount);
  const quoteDiff = targetQuoteAmount.sub(lpUser.quotePosition.depositedAmount);

  const baseDiffPositive = baseDiff.cmp(new BN(0)) > 0;
  const quoteDiffPositive = quoteDiff.cmp(new BN(0)) > 0;
  if (baseDiffPositive || quoteDiffPositive) {
    const baseAmount = baseDiffPositive ? baseDiff : new BN(0);
    const quoteAmount = quoteDiffPositive ? quoteDiff : new BN(0);
    console.info("stake", baseAmount.toNumber(), quoteAmount.toNumber());
    transaction.add(
      program.transaction.depositToFarm(baseAmount, quoteAmount, {
        accounts: {
          marketConfig: new PublicKey(deployConfigV2.marketConfig),
          farmInfo: new PublicKey(poolConfig.farmInfo),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          liquidityProvider: lpPublicKey,
          owner: walletPubkey,
        },
      }),
    );
  }

  const baseDiffNegative = baseDiff.cmp(new BN(0)) < 0;
  const quoteDiffNegative = quoteDiff.cmp(new BN(0)) < 0;
  if (baseDiffNegative || quoteDiffNegative) {
    const baseAmount = baseDiffNegative ? baseDiff.abs() : new BN(0);
    const quoteAmount = quoteDiffNegative ? quoteDiff.abs() : new BN(0);
    console.info("unstake", baseAmount.toNumber(), quoteAmount.toNumber());
    transaction.add(
      program.transaction.withdrawFromFarm(baseAmount, quoteAmount, {
        accounts: {
          marketConfig: new PublicKey(deployConfigV2.marketConfig),
          farmInfo: new PublicKey(poolConfig.farmInfo),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          liquidityProvider: lpPublicKey,
          owner: walletPubkey,
        },
      }),
    );
  }

  const signers = [];
  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}

export async function createStakeTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  walletPubkey: PublicKey,
  baseAmount: BN,
  qouteAmount: BN,
) {
  const [lpPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("LiquidityProvider"),
      new PublicKey(poolConfig.swapInfo).toBuffer(),
      walletPubkey.toBuffer(),
    ],
    program.programId,
  );

  let transaction = new Transaction();
  transaction.add(
    program.transaction.depositToFarm(baseAmount, qouteAmount, {
      accounts: {
        marketConfig: new PublicKey(deployConfigV2.marketConfig),
        farmInfo: new PublicKey(poolConfig.farmInfo),
        swapInfo: new PublicKey(poolConfig.swapInfo),
        liquidityProvider: lpPublicKey,
        owner: walletPubkey,
      },
    }),
  );

  const signers = [];
  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}

export async function createUnstakeTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  walletPubkey: PublicKey,
  baseAmount: BN,
  qouteAmount: BN,
) {
  const [lpPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("LiquidityProvider"),
      new PublicKey(poolConfig.swapInfo).toBuffer(),
      walletPubkey.toBuffer(),
    ],
    program.programId,
  );

  let transaction = new Transaction();
  transaction.add(
    program.transaction.withdrawFromFarm(baseAmount, qouteAmount, {
      accounts: {
        marketConfig: new PublicKey(deployConfigV2.marketConfig),
        farmInfo: new PublicKey(poolConfig.farmInfo),
        swapInfo: new PublicKey(poolConfig.swapInfo),
        liquidityProvider: lpPublicKey,
        owner: walletPubkey,
      },
    }),
  );

  const signers = [];
  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}

export async function createClaimFarmRewardsTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  walletPubkey: PublicKey,
  userDeltafiToken: PublicKey,
) {
  const [lpPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("LiquidityProvider"),
      new PublicKey(poolConfig.swapInfo).toBuffer(),
      walletPubkey.toBuffer(),
    ],
    program.programId,
  );

  let transactionCreateDeltafiTokenAccount: Transaction;
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

  const transactionClaimFarmReward = program.transaction.claimFarmRewards({
    accounts: {
      marketConfig: new PublicKey(deployConfigV2.marketConfig),
      farmInfo: new PublicKey(poolConfig.farmInfo),
      swapInfo: new PublicKey(poolConfig.swapInfo),
      liquidityProvider: lpPublicKey,
      userDeltafiToken,
      swapDeltafiToken: new PublicKey(deployConfigV2.deltafiToken),
      owner: walletPubkey,
      tokenProgram: token.TOKEN_PROGRAM_ID,
    },
  });

  const signers = [];
  return partialSignTransaction({
    transaction: mergeTransactions([
      transactionCreateDeltafiTokenAccount,
      transactionClaimFarmReward,
    ]),
    feePayer: walletPubkey,
    signers,
    connection,
  });
}
