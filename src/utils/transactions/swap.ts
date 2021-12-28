import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { createApproveInstruction, createSwapInstruction, SwapData, SWAP_DIRECTION } from 'lib/instructions'
import { ExTokenAccount, MarketConfig, PoolInfo } from 'providers/types'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { createTokenAccountTransaction, mergeTransactions, signTransaction } from '.'

export async function swap({
  connection,
  walletPubkey,
  config,
  pool,
  source,
  destinationRef,
  rewardTokenRef,
  swapData,
}: {
  connection: Connection
  walletPubkey: PublicKey
  config: MarketConfig
  pool: PoolInfo
  source: ExTokenAccount
  destinationRef?: PublicKey
  rewardTokenRef?: PublicKey
  swapData: SwapData
}) {
  if (!connection || !walletPubkey || !pool || !config || !source) {
    return null
  }

  let createDestinationAccountTransaction: Transaction | undefined
  if (!destinationRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: new PublicKey(
        pool.baseTokenInfo.address === source.account.mint.toString()
          ? pool.quoteTokenInfo.address
          : pool.baseTokenInfo.address,
      ),
    })
    destinationRef = result?.newAccountPubkey
    createDestinationAccountTransaction = result?.transaction
  }

  let createRewardAccountTransaction: Transaction | undefined
  if (!rewardTokenRef) {
    const result = await createTokenAccountTransaction({
      walletPubkey,
      mintPublicKey: config.deltafiMint,
    })
    rewardTokenRef = result?.newAccountPubkey
    createRewardAccountTransaction = result?.transaction
  }

  const userTransferAuthority = Keypair.generate()
  let nonce = new BN(config.bumpSeed)
  const marketAuthority = await PublicKey.createProgramAddress(
    [config.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )
  nonce = new BN(pool.nonce)
  const swapAuthority = await PublicKey.createProgramAddress(
    [pool.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 1)],
    SWAP_PROGRAM_ID,
  )

  let [swapSource, swapDestination, adminFeeDestination] = (function () {
    if (swapData.swapDirection === SWAP_DIRECTION.SellBase) {
      return [pool.base, pool.quote, pool.quoteFee]
    } else {
      return [pool.quote, pool.base, pool.baseFee]
    }
  })()

  let transaction = new Transaction()
  transaction
    .add(createApproveInstruction(source.pubkey, userTransferAuthority.publicKey, walletPubkey, swapData.amountIn))
    .add(
      createSwapInstruction(
        config.publicKey,
        pool.publicKey,
        marketAuthority,
        swapAuthority,
        userTransferAuthority.publicKey,
        source.pubkey,
        swapSource,
        swapDestination,
        destinationRef,
        rewardTokenRef,
        config.deltafiMint,
        adminFeeDestination,
        pool.pythBase,
        pool.pythQuote,
        swapData,
        SWAP_PROGRAM_ID,
      ),
    )

  transaction = mergeTransactions([createDestinationAccountTransaction, createRewardAccountTransaction, transaction])

  return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
}
