import { Connection, PublicKey } from "@solana/web3.js";
import { partialSignTransaction } from "..";
import { deployConfigV2 } from "constants/deployConfigV2";
import { web3 } from "@project-serum/anchor";

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
