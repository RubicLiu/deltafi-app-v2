import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { partialSignTransaction } from ".";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { BN } from "@project-serum/anchor";
import * as token from "@solana/spl-token";
import { FarmUser } from "anchor/type_definitions";

export async function createUpdateStakeTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  farmInfo: string,
  walletPubkey: PublicKey,
  farmUser: FarmUser,
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

  const [farmUserPubKey, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("FarmUser"), new PublicKey(farmInfo).toBuffer(), walletPubkey.toBuffer()],
    program.programId,
  );

  let transaction = new Transaction();

  if (!farmUser) {
    transaction.add(
      program.transaction.createFarmUserV2(bump, {
        accounts: {
          marketConfig: new PublicKey(deployConfigV2.marketConfig),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          farmInfo: new PublicKey(farmInfo),
          farmUser: farmUserPubKey,
          owner: walletPubkey,
          payer: walletPubkey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }),
    );
  }

  const baseDiff = targetBaseAmount.sub(farmUser?.basePosition.depositedAmount || new BN(0));
  const quoteDiff = targetQuoteAmount.sub(farmUser?.quotePosition.depositedAmount || new BN(0));

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
          farmInfo: new PublicKey(farmInfo),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          liquidityProvider: lpPublicKey,
          farmUser: farmUserPubKey,
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
          farmInfo: new PublicKey(farmInfo),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          liquidityProvider: lpPublicKey,
          farmUser: farmUserPubKey,
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

export async function createClaimFarmRewardsTransaction(
  program: any,
  connection: Connection,
  farmPoolInfoList: { poolConfig: PoolConfig; farmInfo: string }[],
  walletPubkey: PublicKey,
  userDeltafiToken: PublicKey,
) {
  let transaction = new Transaction();

  for (let i = 0; i < farmPoolInfoList.length; i++) {
    const poolConfig = farmPoolInfoList[i].poolConfig;
    const farmInfo = farmPoolInfoList[i].farmInfo;
    const [farmUserPubKey] = await PublicKey.findProgramAddress(
      [Buffer.from("FarmUser"), new PublicKey(farmInfo).toBuffer(), walletPubkey.toBuffer()],
      program.programId,
    );

    transaction.add(
      program.transaction.claimFarmRewards({
        accounts: {
          marketConfig: new PublicKey(deployConfigV2.marketConfig),
          farmInfo: new PublicKey(farmInfo),
          swapInfo: new PublicKey(poolConfig.swapInfo),
          farmUser: farmUserPubKey,
          userDeltafiToken,
          swapDeltafiToken: new PublicKey(deployConfigV2.deltafiToken),
          owner: walletPubkey,
          tokenProgram: token.TOKEN_PROGRAM_ID,
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
