import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { createNativeSOLHandlingTransactions } from './utils' 
import { PoolInfo, ExTokenAccount, MarketConfig } from 'providers/types'
import { createApproveInstruction, createStableDepositInstruction, DepositData } from 'lib/instructions'
import { createTokenAccountTransaction, signTransaction, mergeTransactions } from '.'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { createRefreshFarmInstruction } from 'lib/instructions/farm'
import { createFarmUser } from './farm'
import { AccountLayout } from '@solana/spl-token'

export async function stableDeposit({
  connection,
  walletPubkey,
  pool,
  baseAccount,
  quoteAccount,
  poolTokenRef = undefined,
  basePricePythKey,
  quotePricePythKey,
  depositData,
  config,
  farmPool,
  farmUser,
}: {
  connection: Connection
  walletPubkey: PublicKey
  pool: PoolInfo
  baseAccount: ExTokenAccount
  quoteAccount: ExTokenAccount
  poolTokenRef?: PublicKey
  basePricePythKey: PublicKey
  quotePricePythKey: PublicKey
  depositData: DepositData
  config: MarketConfig
  farmPool?: PublicKey
  farmUser?: PublicKey
}) {
  if (!connection || !walletPubkey || !pool || !baseAccount || !quoteAccount) {
    console.error("stable deposit failed with null parameter");
    return null
  }

  let createAccountTransaction: Transaction | undefined
  if (!poolTokenRef) {
    const result = await createTokenAccountTransaction({ walletPubkey, mintPublicKey: pool.poolMintKey })
    poolTokenRef = result?.newAccountPubkey
    createAccountTransaction = result?.transaction
  }

  const userTransferAuthority = Keypair.generate()
  const nonce = new BN(pool.nonce)
  const swapAuthority = await PublicKey.createProgramAddress(
    [pool.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )
  
  let baseSourceRef = baseAccount.pubkey;
  let quoteSourceRef = quoteAccount.pubkey;
  let createWrappedTokenAccountTransaction: Transaction | undefined
  let initializeWrappedTokenAccountTransaction: Transaction | undefined
  let closeWrappedTokenAccountTransaction: Transaction | undefined
  
  const baseSOL = pool.baseTokenInfo.symbol === "SOL";
  const quoteSOL = pool.quoteTokenInfo.symbol === "SOL";
  const tempAccountRefKeyPair = Keypair.generate();
  const lamports = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

  if (baseSOL || quoteSOL) {
    const tmpAccountLamport = baseSOL ? Number(depositData.amountTokenA) + lamports * 2 : Number(depositData.amountTokenB) + lamports * 2; 

    const nativeSOLHandlingTransactions = createNativeSOLHandlingTransactions(tempAccountRefKeyPair.publicKey, tmpAccountLamport, walletPubkey);
    createWrappedTokenAccountTransaction = nativeSOLHandlingTransactions.createWrappedTokenAccountTransaction;
    initializeWrappedTokenAccountTransaction = nativeSOLHandlingTransactions.initializeWrappedTokenAccountTransaction;
    closeWrappedTokenAccountTransaction = nativeSOLHandlingTransactions.closeWrappedTokenAccountTransaction;

    if (baseSOL) {
      baseSourceRef = tempAccountRefKeyPair.publicKey;
    }
    else {
      quoteSourceRef = tempAccountRefKeyPair.publicKey;
    }
  }

  let transaction = new Transaction()
  transaction
    .add(
      createApproveInstruction(
        baseSourceRef,
        userTransferAuthority.publicKey,
        walletPubkey,
        depositData.amountTokenA,
      ),
    )
    .add(
      createApproveInstruction(
        quoteSourceRef,
        userTransferAuthority.publicKey,
        walletPubkey,
        depositData.amountTokenB,
      ),
    )
    .add(
      createStableDepositInstruction(
        pool.publicKey,
        swapAuthority,
        userTransferAuthority.publicKey,
        baseSourceRef,
        quoteSourceRef,
        pool.base,
        pool.quote,
        pool.poolMintKey,
        poolTokenRef,
        depositData,
        SWAP_PROGRAM_ID,
      ),
    )
  let signers = [userTransferAuthority]
  if (!farmUser && farmPool) {
    const { transaction: createFarmUserTransaction, address: newFarmUser } = await createFarmUser({
      connection,
      walletPubkey,
      config,
    })
    transaction = mergeTransactions([createFarmUserTransaction, transaction])
    transaction.add(
      createRefreshFarmInstruction(farmPool, SWAP_PROGRAM_ID, [
        newFarmUser.publicKey,
      ]),
    )
    signers.push(newFarmUser)
  } else {
    // transaction.add(
    //   createRefreshFarmInstruction(farmPool, pool.poolMintKey, [farmUser])
    // )
  } 

  transaction = mergeTransactions([createWrappedTokenAccountTransaction, initializeWrappedTokenAccountTransaction, createAccountTransaction, transaction, closeWrappedTokenAccountTransaction]);
  if (baseSOL || quoteSOL) {
    signers.push(tempAccountRefKeyPair);
  }

  return await signTransaction({ transaction, feePayer: walletPubkey, signers, connection })
}
