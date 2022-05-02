import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { partialSignTransaction, mergeTransactions } from "..";
import * as token from "@solana/spl-token";
import { PoolConfig } from "constants/deployConfigV2";
import { web3, BN } from "@project-serum/anchor";

export async function createDepositTransaction(
  program: any,
  connection: Connection,
  poolConfig: PoolConfig,
  swapInfo: any,
  userTokenBase: PublicKey,
  userTokenQuote: PublicKey,
  walletPubkey: PublicKey,
  lpUser: any,
  baseAmount: BN,
  qouteAmount: BN,
) {
  // TODO(ypeng): Add native SOL wrap logic.
  let transaction: Transaction = null;
  const [lpPublicKey, lpBump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("LiquidityProvider"),
      new PublicKey(poolConfig.swapInfo).toBuffer(),
      walletPubkey.toBuffer(),
    ],
    program.programId,
  );

  if (swapInfo.swapType.stableSwap) {
    transaction = program.transaction.depositToStableSwap(baseAmount, qouteAmount, {
      accounts: {
        swapInfo: new PublicKey(poolConfig.swapInfo),
        userTokenBase,
        userTokenQuote,
        liquidityProvider: lpPublicKey,
        tokenBase: swapInfo.tokenBase,
        tokenQuote: swapInfo.tokenQuote,
        userAuthority: walletPubkey,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      },
    });
  } else {
    transaction = program.transaction.depositToNormalSwap(baseAmount, qouteAmount, {
      accounts: {
        swapInfo: new PublicKey(poolConfig.swapInfo),
        userTokenBase,
        userTokenQuote,
        liquidityProvider: lpPublicKey,
        tokenBase: swapInfo.tokenBase,
        tokenQuote: swapInfo.tokenQuote,
        pythPriceBase: swapInfo.pythPriceBase,
        pythPriceQuote: swapInfo.pythPriceQuote,
        userAuthority: walletPubkey,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      },
    });
  }

  if (lpUser == null) {
    const createLpTransaction = program.transaction.createLiquidityProvider(lpBump, {
      accounts: {
        marketConfig: swapInfo.configKey,
        swapInfo: new PublicKey(poolConfig.swapInfo),
        liquidityProvider: lpPublicKey,
        owner: walletPubkey,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
    });
    transaction = mergeTransactions([createLpTransaction, transaction]);
  }

  const signers = [];
  return partialSignTransaction({
    transaction,
    feePayer: walletPubkey,
    signers,
    connection,
  });
}
