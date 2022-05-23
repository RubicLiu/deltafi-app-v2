import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { partialSignTransaction } from ".";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";


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
