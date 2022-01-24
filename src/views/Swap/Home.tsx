import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Context, SignatureResult } from '@solana/web3.js'
import ReactCardFlip from 'react-card-flip'
import {
  Typography,
  IconButton,
  makeStyles,
  Theme,
  Paper,
  Container,
  Box,
  Fab,
  Snackbar,
  SnackbarContent,
  Link,
} from '@material-ui/core'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import SettingsIcon from '@material-ui/icons/Settings'
import SyncAlt from '@material-ui/icons/SyncAlt'
import CloseIcon from '@material-ui/icons/Close'

import Page from 'components/layout/Page'
import { ConnectButton } from 'components'
import SettingsPanel from 'components/SettingsPanel/SettingsPanel'
import SwapCard from './components/Card'
import { useModal } from 'providers/modal'
import { getTokenAccountInfo, getTokenInfo, parseTokenAccountData, useTokenFromMint } from 'providers/tokens'
import { usePoolFromSymbols } from 'providers/pool'
import { exponentiate, exponentiatedBy } from 'utils/decimal'
import { swap } from 'utils/transactions/swap'
import { useConfig } from 'providers/config'
import { DELTAFI_TOKEN_MINT, SOLSCAN_LINK } from 'constants/index'
import { usePriceBySymbol } from 'providers/pyth'
import { SWAP_DIRECTION } from 'lib/instructions'
import { sendSignedTransaction } from 'utils/transactions'
import { getSwapOutAmount } from 'utils/swap'
import { SwapCard as ISwapCard } from './components/types'
import { tokens } from 'constants/tokens'
import { useCustomConnection } from 'providers/connection'

interface TransactionResult {
  status: boolean | null
  hash?: string
  base?: ISwapCard
  quote?: ISwapCard
}

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    maxWidth: 550,
    margin: '0 auto',
    flex: 1,
  },
  title: {
    textAlign: 'start',
    marginBottom: spacing(4),
  },
  root: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    [breakpoints.up('sm')]: {
      padding: `${spacing(5)}px ${spacing(4)}px`,
      borderRadius: spacing(3),
    },
  },
  swapIcon: {
    transform: 'rotate(90deg)',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: -16,
    marginBottom: -16,
    backgroundColor: palette.background.secondary,
    border: `3px solid ${palette.background.primary}`,
  },
  ratePanel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(2.5),
    [breakpoints.up('sm')]: {
      marginBottom: spacing(3.5),
    },
  },
  marketCondition: {
    fontWeight: 'bold',
  },
  snackBarContent: {
    maxWidth: 421,
    backgroundColor: palette.background.lightBlack,
    display: 'flex',
    flexWrap: 'unset',
    alignItems: 'start',
  },
  snackBarLink: {
    color: palette.text.blue,
    cursor: 'pointer',
    textDecoration: 'none !important',
    marginLeft: spacing(1),
  },
  snackBarClose: {
    marginTop: 5,
  },
  snackBarIcon: {
    marginRight: spacing(2),
  },
}))

const Home: React.FC = (props) => {
  const classes = useStyles(props)
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [tokenFrom, setTokenFrom] = useState<ISwapCard>({
    token: getTokenInfo('SOL'),
    amount: '',
  })
  const [tokenTo, setTokenTo] = useState<ISwapCard>({
    token: getTokenInfo('SRM'),
    amount: '',
  })
  const { config } = useConfig()
  const pool = usePoolFromSymbols(tokenFrom.token.symbol, tokenTo.token.symbol)
  const sourceAccount = useTokenFromMint(tokenFrom.token.address)
  const destinationAccount = useTokenFromMint(tokenTo.token.address)
  const sourceBalance = useMemo(() => {
    if (sourceAccount && tokenFrom) {
      return exponentiatedBy(sourceAccount.account.amount, tokenFrom.token.decimals)
    }
    return null
  }, [sourceAccount, tokenFrom])
  const destinationBalance = useMemo(() => {
    if (destinationAccount && tokenTo) {
      return exponentiatedBy(destinationAccount.account.amount, tokenTo.token.decimals)
    }
    return null
  }, [destinationAccount, tokenTo])
  const rewardsAccount = useTokenFromMint(DELTAFI_TOKEN_MINT.toBase58())
  const { price: basePrice } = usePriceBySymbol(pool?.baseTokenInfo.symbol)
  const { price: quotePrice } = usePriceBySymbol(pool?.quoteTokenInfo.symbol)
  const [priceImpact, setPriceImpact] = useState('2.0')
  const [isIncludeDecimal, setIsIncludeDecimal] = useState(true)
  const [openSettings, setOpenSettings] = useState(false)
  const { setMenu } = useModal()
  const exchangeRateLabel = useMemo(() => {
    if (basePrice && quotePrice && pool) {
      if (tokenFrom.token.symbol === pool?.baseTokenInfo.symbol) {
        return Number(basePrice / quotePrice).toFixed(pool.quoteTokenInfo.decimals)
      } else if (tokenFrom.token.symbol === pool?.quoteTokenInfo.symbol) {
        return Number(quotePrice / basePrice).toFixed(pool.baseTokenInfo.decimals)
      }
    }
    return '-'
  }, [basePrice, quotePrice, tokenFrom.token.symbol, pool])
  const [state, setState] = useState<{
    open: boolean
    vertical: 'bottom' | 'top'
    horizontal: 'left' | 'center' | 'right'
  }>({
    open: false,
    vertical: 'bottom',
    horizontal: 'left',
  })
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({
    status: null,
  })
  const { network } = useCustomConnection()

  useEffect(() => {}, [])

  const handleSwapDirectionChange = () => {
    const temp = Object.assign({}, tokenFrom)
    setTokenFrom(tokenTo)
    setTokenTo(temp)
  }

  const handleChangeImpact = (value) => {
    setPriceImpact(value)
  }

  const handleChangeInclude = () => {
    setIsIncludeDecimal(!isIncludeDecimal)
  }

  const handleOpenSettings = () => {
    setOpenSettings(!openSettings)
  }

  const handleSnackBarClose = useCallback(() => {
    setState((state) => ({ ...state, open: false }))
  }, [])

  const handleTokenFromInput = (card: ISwapCard) => {
    let newTokenFrom = card.token
    let newTokenTo = tokenTo.token
    let amountOut = ''
    if (tokenTo.token.address === newTokenFrom.address) {
      newTokenTo = Object.assign({}, tokenFrom.token)
    }
    if (pool && priceImpact) {
      const { amountOut: quoteAmount } = getSwapOutAmount(
        pool,
        newTokenFrom.address,
        newTokenTo.address,
        card.amount ?? '0',
        parseFloat(priceImpact),
      )

      amountOut = isNaN(quoteAmount) ? '' : Number(quoteAmount).toString()
    }
    setTokenFrom({ token: newTokenFrom, amount: card.amount })
    setTokenTo({ token: newTokenTo, amount: amountOut })
  }

  const handleTokenToInput = (card: ISwapCard) => {
    let newTokenFrom = tokenFrom.token
    let newTokenTo = card.token
    let amountOut = ''
    if (tokenFrom.token.address === newTokenTo.address) {
      newTokenFrom = Object.assign({}, tokenTo.token)
    }
    if (pool && priceImpact) {
      const { amountOut: quoteAmount } = getSwapOutAmount(
        pool,
        newTokenFrom.address,
        newTokenTo.address,
        tokenFrom.amount ?? '0',
        parseFloat(priceImpact),
      )

      amountOut = isNaN(quoteAmount) ? '' : Number(quoteAmount).toString()
    }
    setTokenFrom({ ...tokenFrom, token: newTokenFrom })
    setTokenTo({ token: newTokenTo, amount: amountOut })
  }

  const swapCallback = useCallback(async () => {
    if (!pool || !config || !sourceAccount || !walletPubkey) {
      return null
    }

    if (sourceBalance.isLessThan(tokenFrom.amount)) {
      return null
    }

    try {
      // const { amountOutWithSlippage } = getSwapOutAmount(
      //   pool,
      //   tokenFrom.token.address,
      //   tokenTo.token.address,
      //   tokenFrom.amount ?? '0',
      //   parseFloat(priceImpact),
      // )
      let transaction = await swap({
        connection,
        walletPubkey,
        config,
        pool,
        source: sourceAccount,
        destinationRef: destinationAccount?.pubkey,
        rewardTokenRef: rewardsAccount?.pubkey,
        swapData: {
          amountIn: BigInt(exponentiate(tokenFrom.amount, tokenFrom.token.decimals).integerValue().toString()),
          minimumAmountOut: BigInt(
            0,
            // exponentiate(amountOutWithSlippage.toString(), tokenFrom.token.decimals).integerValue().toString(),
          ),
          swapDirection:
            tokenFrom.token.symbol === pool.baseTokenInfo.symbol ? SWAP_DIRECTION.SellBase : SWAP_DIRECTION.SellQuote,
        },
      })
      transaction = await signTransaction(transaction)

      const hash = await sendSignedTransaction({ signedTransaction: transaction, connection })

      connection.onSignature(hash, async (signatureResult: SignatureResult, _: Context) => {
        if (!signatureResult.err) {
          const prevBalanceFrom = sourceBalance ?? 0
          const prevBalanceTo = destinationBalance ?? 0
          const tokenAccounts = await getTokenAccountInfo(connection, walletPubkey)
          const from = tokenAccounts.find((acc) => acc.effectiveMint.toBase58() === tokenFrom.token.address)
          const to = tokenAccounts.find((acc) => acc.effectiveMint.toBase58() === tokenTo.token.address)
          if (!from || !to) {
            return
          }
          const nextBalanceFrom = exponentiatedBy(
            parseTokenAccountData(from.account.data).amount,
            tokenFrom.token.decimals,
          )
          const nextBalanceTo = exponentiatedBy(parseTokenAccountData(to.account.data).amount, tokenTo.token.decimals)
          setTransactionResult({
            status: true,
            hash,
            base: {
              ...tokenFrom,
              amount: nextBalanceFrom.minus(prevBalanceFrom).abs().toString(),
            },
            quote: {
              ...tokenTo,
              amount: nextBalanceTo.minus(prevBalanceTo).abs().toString(),
            },
          })
          setState((state) => ({ ...state, open: true }))
        } else {
          setTransactionResult({ status: false })
          setState((state) => ({ ...state, open: true }))
        }
      })

      setTokenFrom({ ...tokenFrom, amount: '' })
      setTokenTo({ ...tokenTo, amount: '' })
    } catch (e) {
      console.log(e)
      setTransactionResult({ status: false })
      setState((state) => ({ ...state, open: true }))
    }
  }, [
    pool,
    config,
    sourceAccount,
    walletPubkey,
    sourceBalance,
    tokenFrom,
    tokenTo,
    // priceImpact,
    connection,
    destinationAccount?.pubkey,
    rewardsAccount?.pubkey,
    signTransaction,
    destinationBalance,
  ])

  const handleSwap = useCallback(async () => {
    if (tokenFrom.amount) {
      setMenu(true, 'confirm-swap', undefined, {
        tokenFrom,
        tokenTo,
        slippage: parseFloat(priceImpact),
        callback: swapCallback,
      })
    }
  }, [tokenFrom, tokenTo, priceImpact, swapCallback, setMenu])

  const snackMessasge = useMemo(() => {
    if (!transactionResult.status) {
      return (
        <Box display="flex" alignItems="center">
          <img src={`/images/snack-fail.svg`} alt="snack-status-icon" className={classes.snackBarIcon} />
          <Box>
            <Typography variant="h6" color="primary">
              Transaction failed(try again later)
            </Typography>
            <Box>
              <Typography variant="body1" color="primary">
                failed to send transaction: Transaction simulation failed: Blockhash not found
              </Typography>
            </Box>
          </Box>
        </Box>
      )
    }

    const { base, quote, hash } = transactionResult

    return (
      <Box display="flex" alignItems="center">
        <img src={`/images/snack-success.svg`} alt="snack-status-icon" className={classes.snackBarIcon} />
        <Box>
          <Typography variant="body1" color="primary">
            {`Swap ${Number(base.amount).toFixed(2)} ${base.token.symbol} to ${Number(quote.amount).toFixed(2)} ${
              quote.token.symbol
            } for ${base.token.symbol}-${quote.token.symbol} Pool`}
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" color="primary">
              View Transaction:
            </Typography>
            <Link
              className={classes.snackBarLink}
              target="_blank"
              href={`${SOLSCAN_LINK}/tx/${hash}?cluster=${network}`}
            >
              {hash.slice(0, 7) + '...' + hash.slice(-7)}
            </Link>
          </Box>
        </Box>
      </Box>
    )
  }, [transactionResult, classes, network])

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    )
  }, [handleSnackBarClose, classes])

  const actionButton = useMemo(() => {
    if (isConnectedWallet) {
      const isInsufficientBalance = sourceBalance?.isLessThan(tokenFrom.amount)
      const isInsufficientLiquidity = exponentiatedBy(
        tokenFrom.token.symbol === pool.baseTokenInfo.symbol ? pool?.poolState.quoteReserve : pool?.poolState.baseReserve, 
        tokenFrom.token.decimals
      ).isLessThan(
        tokenTo.amount,
      )

      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="outlined"
          disabled={isInsufficientBalance || isInsufficientLiquidity}
          onClick={handleSwap}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Swap, target: EnterAmount"
        >
          {isInsufficientBalance ? 'Insufficient Balance' : isInsufficientLiquidity ? 'Insufficient Liquidity' : 'Swap'}
        </ConnectButton>
      )
    }

    return (
      <ConnectButton fullWidth size="large" onClick={() => setMenu(true, 'connect')}>
        Connect Wallet
      </ConnectButton>
    )
  }, [isConnectedWallet, handleSwap, setMenu, sourceBalance, pool, tokenFrom])

  if (!pool) return null

  const { open, vertical, horizontal } = state

  return (
    <Page>
      <Container className={classes.container}>
        <Typography variant="h5" color="primary" align="center" paragraph className={classes.title}>
          Swap
        </Typography>
        <Paper className={classes.root}>
          <Box className={classes.ratePanel}>
            <Typography color="primary" variant="body1" className={classes.marketCondition}>
              {`1 ${tokenFrom.token.symbol} = ${exchangeRateLabel} ${tokenTo.token.symbol}`}
            </Typography>
            <IconButton
              onClick={handleOpenSettings}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Swap, target: Settings"
            >
              <SettingsIcon color="primary" />
            </IconButton>
          </Box>
          <ReactCardFlip isFlipped={openSettings} containerStyle={{ position: 'relative', zIndex: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <SwapCard card={tokenFrom} tokens={tokens} handleChangeCard={handleTokenFromInput} />
              {!openSettings && (
                <Fab color="secondary" size="small" className={classes.swapIcon} onClick={handleSwapDirectionChange}>
                  <SyncAlt />
                </Fab>
              )}
              <SwapCard card={tokenTo} tokens={tokens} handleChangeCard={handleTokenToInput} disabled={true} />
            </Box>
            <SettingsPanel
              isOpen={openSettings}
              priceImpact={priceImpact}
              isIncludeDecimal={isIncludeDecimal}
              handleChangeImpact={handleChangeImpact}
              handleChangeInclude={handleChangeInclude}
              handleClose={handleOpenSettings}
            />
          </ReactCardFlip>
          <Box marginTop={2} width="100%" position="relative" zIndex={1}>
            {actionButton}
          </Box>
        </Paper>
      </Container>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        onClose={handleSnackBarClose}
        key={vertical + horizontal}
      >
        <SnackbarContent
          aria-describedby="message-id2"
          className={classes.snackBarContent}
          message={snackMessasge}
          action={snackAction}
        />
      </Snackbar>
    </Page>
  )
}

export default Home
