import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { PoolInfo, ExTokenAccount } from 'providers/types'
import {
  createApproveInstruction,
  createWithdrawInstruction,
  WithdrawData,
  WithdrawOneData,
  createWithdrawOneInstruction,
} from 'lib/instructions'
import { createTokenAccountTransaction, mergeTransactions, signTransaction } from '.'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { TokenInfo } from 'constants/tokens'
import { createRefreshFarmInstruction } from 'lib/instructions/farm'

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
    .add(createRefreshFarmInstruction(pool.publicKey, farmPool, pool.poolMintKey, SWAP_PROGRAM_ID, [farmUser]))

  transaction = mergeTransactions([createBaseTokenTransaction, createQuoteTokenTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
}

export async function withdrawOne({
  connection,
  walletPubkey,
  pool,
  source,
  destination,
  basePricePythKey,
  quotePricePythKey,
  withdrawData,
}: {
  connection: Connection
  walletPubkey: PublicKey
  pool: PoolInfo
  source: ExTokenAccount
  destination: ExTokenAccount | TokenInfo
  basePricePythKey: PublicKey
  quotePricePythKey: PublicKey
  withdrawData: WithdrawOneData
}) {
  if (!connection || !walletPubkey || !pool || !source) {
    return null
  }

  let createAccountTransaction: Transaction | undefined
  let destinationTokenRef: PublicKey
  let destinationMint: PublicKey
  if (!('pubkey' in destination)) {
    destinationMint = new PublicKey(destination.address)
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: destinationMint,
    })
    destinationTokenRef = result?.newAccountPubkey
    createAccountTransaction = result?.transaction
  } else {
    destinationTokenRef = destination.pubkey
    destinationMint = destination.effectiveMint
  }

  const userTransferAuthority = Keypair.generate()
  const nonce = new BN(pool.nonce)
  const swapAuthority = await PublicKey.createProgramAddress(
    [pool.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )

  let swapDestination: PublicKey
  let feeDestination: PublicKey
  if (destinationMint.toBase58() === pool.baseTokenInfo.address) {
    swapDestination = pool.base
    feeDestination = pool.baseFee
  } else if (destinationMint.toBase58() === pool.quoteTokenInfo.address) {
    swapDestination = pool.quote
    feeDestination = pool.quoteFee
  } else {
    return null
  }

  let transaction = new Transaction()
  transaction
    .add(
      createApproveInstruction(
        source.pubkey,
        userTransferAuthority.publicKey,
        walletPubkey,
        withdrawData.amountPoolToken,
      ),
    )
    .add(
      createWithdrawOneInstruction(
        pool.publicKey,
        swapAuthority,
        userTransferAuthority.publicKey,
        source.pubkey,
        pool.poolMintKey,
        swapDestination,
        destinationTokenRef,
        feeDestination,
        basePricePythKey,
        quotePricePythKey,
        withdrawData,
        SWAP_PROGRAM_ID,
      ),
    )

  transaction = mergeTransactions([createAccountTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
}
