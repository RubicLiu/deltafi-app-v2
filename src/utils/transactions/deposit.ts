import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { PoolInfo, ExTokenAccount, MarketConfig } from 'providers/types'
import { createApproveInstruction, createDepositInstruction, DepositData } from 'lib/instructions'
import { createTokenAccountTransaction, signTransaction, mergeTransactions } from '.'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { createRefreshFarmInstruction } from 'lib/instructions/farm'
import { createFarmUser } from './farm'

export async function deposit({
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
  let transaction = new Transaction()
  transaction
    .add(
      createApproveInstruction(
        baseAccount.pubkey,
        userTransferAuthority.publicKey,
        walletPubkey,
        depositData.amountTokenA,
      ),
    )
    .add(
      createApproveInstruction(
        quoteAccount.pubkey,
        userTransferAuthority.publicKey,
        walletPubkey,
        depositData.amountTokenB,
      ),
    )
    .add(
      createDepositInstruction(
        pool.publicKey,
        swapAuthority,
        userTransferAuthority.publicKey,
        baseAccount.pubkey,
        quoteAccount.pubkey,
        pool.base,
        pool.quote,
        pool.poolMintKey,
        poolTokenRef,
        basePricePythKey,
        quotePricePythKey,
        depositData,
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

  transaction = mergeTransactions([createAccountTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers, connection })
}
