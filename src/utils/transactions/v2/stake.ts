import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { partialSignTransaction, mergeTransactions } from "..";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { BN } from "@project-serum/anchor";

export async function createWithdrawTransaction(
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
    program.rpc.depositToFarm(baseAmount, qouteAmount, {
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
