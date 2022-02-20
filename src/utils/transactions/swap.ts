import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

import { createApproveInstruction, createSwapInstruction, SwapData, SWAP_DIRECTION } from 'lib/instructions'
import { ExTokenAccount, MarketConfig, PoolInfo } from 'providers/types'
import { SWAP_PROGRAM_ID } from 'constants/index'
import { createTokenAccountTransaction, mergeTransactions, signTransaction } from '.'
import { AccountLayout, Token, TOKEN_PROGRAM_ID, NATIVE_MINT } from '@solana/spl-token'
import { parseTokenMintData } from 'providers/tokens'

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

  console.log("pool info", pool.swapType);
  const lamports = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);
  const tempAccountRefKeyPair = Keypair.generate();
  let createWrappedTokenAccountTransaction: Transaction | undefined
  let initializeWrappedTokenAccountTransaction: Transaction | undefined
  let closeWrappedTokenAccountTransaction: Transaction | undefined


  let buySol = (pool.quoteTokenInfo.symbol === 'SOL' && swapData.swapDirection === SWAP_DIRECTION.SellBase) || 
  (pool.baseTokenInfo.symbol === 'SOL' && swapData.swapDirection === SWAP_DIRECTION.SellQuote)

  let sellSol = (pool.quoteTokenInfo.symbol === 'SOL' && swapData.swapDirection === SWAP_DIRECTION.SellQuote) || 
  (pool.baseTokenInfo.symbol === 'SOL' && swapData.swapDirection === SWAP_DIRECTION.SellBase)

  let sourceRef: PublicKey = source.pubkey;

  if ( buySol || sellSol) {
      let tmpAccountLamport = buySol ? (lamports * 2) : (Number(swapData.amountIn) + lamports * 2);

      createWrappedTokenAccountTransaction = new Transaction()
      createWrappedTokenAccountTransaction
      .add(
        SystemProgram.createAccount({
          fromPubkey: walletPubkey,
          newAccountPubkey: tempAccountRefKeyPair.publicKey,
          lamports: tmpAccountLamport,
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      )

      initializeWrappedTokenAccountTransaction = new Transaction()
      initializeWrappedTokenAccountTransaction
      .add(
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          NATIVE_MINT,
          tempAccountRefKeyPair.publicKey,
          walletPubkey,
        )
      )
      
      closeWrappedTokenAccountTransaction = new Transaction()
      closeWrappedTokenAccountTransaction
      .add(
        Token.createCloseAccountInstruction(
          TOKEN_PROGRAM_ID,
          tempAccountRefKeyPair.publicKey,
          walletPubkey,
          walletPubkey,
          []
        )
      )
      if (buySol) {
        destinationRef = tempAccountRefKeyPair.publicKey
      } else {
        sourceRef = tempAccountRefKeyPair.publicKey
      }
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

  const mintInfo = await connection.getAccountInfo(source.account.mint);
  const mintdata = parseTokenMintData(mintInfo);
  const mInfo = await connection.getAccountInfo(new PublicKey(pool.baseTokenInfo.address));
  const mData = parseTokenMintData(mInfo);

  let transaction = new Transaction()
  transaction
    .add(createApproveInstruction(sourceRef, userTransferAuthority.publicKey, walletPubkey, swapData.amountIn))
    .add(
      createSwapInstruction(
        config.publicKey,
        pool.publicKey,
        marketAuthority,
        swapAuthority,
        userTransferAuthority.publicKey,
        sourceRef,
        swapSource,
        source.account.mint, 
        swapDestination,
        destinationRef,
        new PublicKey(pool.baseTokenInfo.address === source.account.mint.toBase58() ? pool.quoteTokenInfo.address : pool.baseTokenInfo.address),
        rewardTokenRef,
        config.deltafiToken,
        adminFeeDestination,
        pool.pythBase,
        pool.pythQuote,
        swapData,
        SWAP_PROGRAM_ID,
      ),
    )

  transaction = mergeTransactions([createWrappedTokenAccountTransaction, initializeWrappedTokenAccountTransaction, createDestinationAccountTransaction, createRewardAccountTransaction, transaction, closeWrappedTokenAccountTransaction])
  if ( buySol || sellSol ) {
      return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority, tempAccountRefKeyPair], connection })
  } else {
      return await signTransaction({ transaction, feePayer: walletPubkey, signers: [userTransferAuthority], connection })
  }
}
