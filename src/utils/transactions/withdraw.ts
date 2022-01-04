import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { PoolInfo, ExTokenAccount, MarketConfig } from 'providers/types'
import { createApproveInstruction, createWithdrawInstruction, WithdrawData } from 'lib/instructions'
import { createTokenAccountTransaction, mergeTransactions, signTransaction } from '.'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { TokenInfo } from 'constants/tokens'
import { createRefreshFarmInstruction } from 'lib/instructions/farm'
import { createFarmUser } from './farm'

export async function withdraw({
  connection,
  walletPubkey,
  poolTokenAccount,
  pool,
  baseTokenRef,
  quteTokenRef,
  basePricePythKey,
  quotePricePythKey,
  withdrawData,
  config,
  farmPool,
  farmUser,
}: {
  connection: Connection
  walletPubkey: PublicKey
  poolTokenAccount: ExTokenAccount
  pool: PoolInfo
  baseTokenRef?: PublicKey
  quteTokenRef?: PublicKey
  basePricePythKey: PublicKey
  quotePricePythKey: PublicKey
  withdrawData: WithdrawData
  config: MarketConfig
  farmPool?: PublicKey
  farmUser?: PublicKey
}) {
  if (!connection || !walletPubkey || !pool || !poolTokenAccount) {
    return null
  }

  let createBaseTokenTransaction: Transaction | undefined
  if (!baseTokenRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: new PublicKey(pool.baseTokenInfo.address),
    })
    baseTokenRef = result?.newAccountPubkey
    createBaseTokenTransaction = result?.transaction
  }

  let createQuoteTokenTransaction: Transaction | undefined
  if (!quteTokenRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: new PublicKey(pool.baseTokenInfo.address),
    })
    quteTokenRef = result?.newAccountPubkey
    createQuoteTokenTransaction = result?.transaction
  }

  const userTransferAuthority = Keypair.generate()
  const nonce = new BN(pool.nonce)
  const swapAuthority = await PublicKey.createProgramAddress(
    [pool.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )

  let transaction = new Transaction()
  transaction
    .add(
      createApproveInstruction(
        poolTokenAccount.pubkey,
        userTransferAuthority.publicKey,
        walletPubkey,
        withdrawData.amountPoolToken,
      ),
    )
    .add(
      createWithdrawInstruction(
        pool.publicKey,
        swapAuthority,
        userTransferAuthority.publicKey,
        poolTokenAccount.pubkey,
        pool.base,
        pool.quote,
        baseTokenRef,
        quteTokenRef,
        pool.poolMintKey,
        pool.baseFee,
        pool.quoteFee,
        basePricePythKey,
        quotePricePythKey,
        withdrawData,
        SWAP_PROGRAM_ID,
      ),
    )

  let signers = [userTransferAuthority]
  if (!farmUser) {
    const { transaction: createFarmUserTransaction, address: newFarmUser } = await createFarmUser({
      connection,
      walletPubkey,
      config,
    })
    transaction = mergeTransactions([createFarmUserTransaction, transaction])
    transaction.add(
      createRefreshFarmInstruction(pool.publicKey, farmPool, pool.poolMintKey, SWAP_PROGRAM_ID, [
        newFarmUser.publicKey,
      ]),
    )
    signers.push(newFarmUser)
  } else {
    transaction.add(
      createRefreshFarmInstruction(pool.publicKey, farmPool, pool.poolMintKey, SWAP_PROGRAM_ID, [farmUser]),
    )
  }

  transaction = mergeTransactions([createBaseTokenTransaction, createQuoteTokenTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
}
