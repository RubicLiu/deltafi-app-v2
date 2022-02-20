import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import BN from 'bn.js'

import {
  createClaimFarmInstruction,
  createFarmDepositInstruction,
  createFarmWithdrawInstruction,
  createInitFarmUserInstruction,
  createRefreshFarmInstruction,
  FarmDepositData,
  FarmWithdrawData,
} from 'lib/instructions/farm'
import { FARM_USER_SIZE } from 'lib/state/farm'
import { ExTokenAccount, FarmPoolInfo, MarketConfig } from 'providers/types'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { createApproveInstruction } from 'lib/instructions'
import { mergeTransactions, signTransaction } from '.'

export async function createFarmUser({
  connection,
  walletPubkey,
  config,
}: {
  connection: Connection
  walletPubkey: PublicKey
  config: MarketConfig
}) {
  if (!connection || !walletPubkey) {
    console.error("create farm user failed with null parameter");
    return null
  }

  const stakeAccount = Keypair.generate()

  const balanceForStakeAccount = await connection.getMinimumBalanceForRentExemption(FARM_USER_SIZE)
  let transaction = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: walletPubkey,
        newAccountPubkey: stakeAccount.publicKey,
        lamports: balanceForStakeAccount,
        space: FARM_USER_SIZE,
        programId: SWAP_PROGRAM_ID,
      }),
    )
    .add(createInitFarmUserInstruction(config.publicKey, stakeAccount.publicKey, walletPubkey, SWAP_PROGRAM_ID))

  return {
    transaction,
    address: stakeAccount,
  }
}

export async function stake({
  connection,
  walletPubkey,
  config,
  farmPool,
  farmUser,
  poolTokenAccount,
  stakeData,
}: {
  connection: Connection
  walletPubkey: PublicKey
  config: MarketConfig
  farmPool: FarmPoolInfo
  farmUser: PublicKey | undefined
  poolTokenAccount: ExTokenAccount
  stakeData: FarmDepositData
}) {
  if (!connection || !walletPubkey || !farmPool || !poolTokenAccount || !config || !stakeData) {
    console.error("farm stake failed with null parameter");
    return null
  }

  let createFarmUserAccountTransaction: Transaction
  let signers = []
  if (!farmUser) {
    const farmUserAccount = Keypair.generate()
    const balance = await connection.getMinimumBalanceForRentExemption(FARM_USER_SIZE)
    createFarmUserAccountTransaction = new Transaction()
      .add(
        SystemProgram.createAccount({
          fromPubkey: walletPubkey,
          newAccountPubkey: farmUserAccount.publicKey,
          lamports: balance,
          space: FARM_USER_SIZE,
          programId: SWAP_PROGRAM_ID,
        }),
      )
      .add(createInitFarmUserInstruction(config.publicKey, farmUserAccount.publicKey, walletPubkey, SWAP_PROGRAM_ID))
    farmUser = farmUserAccount.publicKey
    signers.push(farmUserAccount)
  }

  const userTransferAuthority = Keypair.generate()
  let transaction = new Transaction()
    .add(
      createApproveInstruction(
        poolTokenAccount.pubkey,
        userTransferAuthority.publicKey,
        walletPubkey,
        stakeData.amount,
      ),
    )
    .add(
      createFarmDepositInstruction(
        farmPool.publicKey,
        userTransferAuthority.publicKey,
        poolTokenAccount.pubkey,
        farmPool.poolToken,
        farmUser,
        walletPubkey,
        stakeData,
        SWAP_PROGRAM_ID,
      ),
    )
    .add(
      createRefreshFarmInstruction(farmPool.publicKey, SWAP_PROGRAM_ID, [
        farmUser,
      ]),
    )
  signers.push(userTransferAuthority)

  transaction = mergeTransactions([createFarmUserAccountTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers, connection })
}

export async function unstake({
  connection,
  walletPubkey,
  farmPool,
  farmUser,
  poolTokenAccount,
  unstakeData,
}: {
  connection: Connection
  walletPubkey: PublicKey
  farmPool: FarmPoolInfo
  farmUser: PublicKey
  poolTokenAccount: ExTokenAccount
  unstakeData: FarmWithdrawData
}) {
  if (!connection || !walletPubkey || !farmPool || !farmUser || !poolTokenAccount || !unstakeData) {
    console.error("farm unstake failed with null parameter");
    return null
  }

  let nonce = new BN(farmPool.bumpSeed)
  const farmPoolAuthority = await PublicKey.createProgramAddress(
    [farmPool.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )

  let transaction = new Transaction()
  transaction
    .add(
      createFarmWithdrawInstruction(
        farmPool.publicKey,
        farmUser,
        walletPubkey,
        farmPoolAuthority,
        farmPool.poolToken,
        poolTokenAccount.pubkey,
        unstakeData,
        SWAP_PROGRAM_ID,
      ),
    )
    .add(
      createRefreshFarmInstruction(farmPool.publicKey, SWAP_PROGRAM_ID, [
        farmUser,
      ]),
    )

  return await signTransaction({ transaction, feePayer: walletPubkey, connection })
}

export async function claim({
  connection,
  config,
  walletPubkey,
  farmPool,
  farmUser,
  claimDestination,
}: {
  connection: Connection
  config: MarketConfig
  walletPubkey: PublicKey
  farmPool: FarmPoolInfo
  farmUser: PublicKey
  claimDestination: PublicKey
}) {
  if (!connection || !walletPubkey || !farmPool || !farmUser || !claimDestination) {
    console.error("farm claim failed with null parameter");
    return null
  }

  const nonce = new BN(config.bumpSeed)
  const marketAuthority = await PublicKey.createProgramAddress(
    [config.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )

  const transaction = new Transaction()
  transaction.add(
    createClaimFarmInstruction(
      config.publicKey,
      farmPool.publicKey,
      farmUser,
      walletPubkey,
      marketAuthority,
      claimDestination,
      config.deltafiMint,
      SWAP_PROGRAM_ID,
    ),
  )

  return await signTransaction({ transaction, feePayer: walletPubkey, connection })
}

export async function refresh({
  connection,
  swap,
  farmPool,
  poolMint,
  walletPubkey,
  farmUser,
}: {
  connection: Connection
  swap: PublicKey
  farmPool: PublicKey
  poolMint: PublicKey
  walletPubkey: PublicKey
  farmUser: PublicKey
}) {
  if (!connection || !farmPool || !poolMint || !walletPubkey || !farmUser) {
    console.error("farm refresh failed with null parameter");
    return null
  }

  const transaction = new Transaction()
  transaction.add(createRefreshFarmInstruction(swap, SWAP_PROGRAM_ID, [farmUser]))

  return await signTransaction({ transaction, feePayer: walletPubkey, connection })
}
