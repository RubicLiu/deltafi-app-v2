import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { PoolInfo, ExTokenAccount } from 'providers/types'
import {
  createApproveInstruction,
  createDepositInstruction,
  DepositData,
  createDepositOneInstruction,
  DepositOneData,
} from 'lib/instructions'
import { createTokenAccountTransaction, signTransaction, mergeTransactions } from '.'
import { SWAP_PROGRAM_ID } from 'constants/index'

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

  transaction = mergeTransactions([createAccountTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
}

export async function depositOne({
  connection,
  walletPubkey,
  pool,
  source,
  poolTokenRef = undefined,
  basePricePythKey,
  quotePricePythKey,
  depositData,
}: {
  connection: Connection
  walletPubkey: PublicKey
  pool: PoolInfo
  source: ExTokenAccount
  poolTokenRef?: PublicKey
  basePricePythKey: PublicKey
  quotePricePythKey: PublicKey
  depositData: DepositOneData
}) {
  if (!connection || !walletPubkey || !pool || !source) {
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

  let swapSource: PublicKey
  if (source.effectiveMint.toBase58() === pool.baseTokenInfo.address) {
    swapSource = pool.base
  } else if (source.effectiveMint.toBase58() === pool.quoteTokenInfo.address) {
    swapSource = pool.quote
  } else {
    return null
  }
  let transaction = new Transaction()
  transaction
    .add(
      createApproveInstruction(source.pubkey, userTransferAuthority.publicKey, walletPubkey, depositData.tokenAmount),
    )
    .add(
      createDepositOneInstruction(
        pool.publicKey,
        swapAuthority,
        userTransferAuthority.publicKey,
        source.pubkey,
        swapSource,
        pool.poolMintKey,
        poolTokenRef,
        basePricePythKey,
        quotePricePythKey,
        depositData,
        SWAP_PROGRAM_ID,
      ),
    )

  transaction = mergeTransactions([createAccountTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
}
