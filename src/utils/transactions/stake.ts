import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { partialSignTransaction } from ".";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { BN } from "@project-serum/anchor";
import * as token from "@solana/spl-token";

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

  let transaction = new Transaction();
  transaction.add(
    program.transaction.claimFarmRewards({
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
