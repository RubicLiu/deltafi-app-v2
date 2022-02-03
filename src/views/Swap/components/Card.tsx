import React, { useEffect, useMemo } from 'react'
import CurrencyInput from 'react-currency-input-field'
import { Box, makeStyles, Paper, Theme, Typography } from '@material-ui/core'

import { DropDown } from 'components'
import { CardProps } from './types'
import { getTokenInfo } from 'providers/tokens'
import { useTokenFromMint } from 'providers/tokens'
import { exponentiatedBy } from 'utils/decimal'
import BigNumber from 'bignumber.js'

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    width: '100%',
    background: palette.background.secondary,
    padding: spacing(2),
    borderRadius: 16,
    [breakpoints.up('md')]: {
      padding: `${spacing(3)}px ${spacing(2.5)}px`,
    },
  },
  main: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
    [breakpoints.up('md')]: {
      marginBottom: 16,
    },
  },
  ratePanel: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  tokenSection: {},
  infoSection: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  token: {
    marginLeft: spacing(2),
  },
  tokenSymbol: {
    fontSize: 10,
  },
  currencyInput: {
    color: palette.text.primary,
    textAlign: 'right',
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 14,
    fontWeight: 400,
    width: '100%',
    flex: 1,
    marginLeft: spacing(3),
    [breakpoints.up('md')]: {
      fontSize: 24,
      fontWeight: 500,
    },
    '&::placeholder': {
      color: palette.text.primary,
    },
  },
  tokenBalance: {
    color: palette.text.dark,
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 500,
    [breakpoints.up('md')]: {
      fontSize: 16,
    },
  },
  tokenContainer: {
    padding: '8px 24px',
    borderRadius: 28,
    backgroundColor: palette.background.tertiary,
  },
}))

const SwapCard: React.FC<CardProps> = (props) => {
  const { card, handleChangeCard, disabled, tokens, disableDrop, percentage } = props
  const classes = useStyles(props)
  const tokenAccount = useTokenFromMint(card.token?.address)

  const tokenBalance = useMemo(() => {
    if (tokenAccount && card) {
      return exponentiatedBy(tokenAccount.account.amount, card.token.decimals);
    }
    return null
  }, [tokenAccount, card])
  const amountPercentage = useMemo(() => {
    if (card && tokenBalance && !disabled) {
      const percentage = (parseFloat(card.amount ?? '0') / tokenBalance.toNumber()) * 100
      if (!isNaN(percentage) && percentage <= 100) {
        return Number(percentage).toFixed(2) + '%'
      }
    }
    return '%--'
  }, [card, tokenBalance, disabled])

  useEffect(() => {
    if (percentage && tokenBalance) {
      const realAmount = tokenBalance.multipliedBy(new BigNumber(percentage)).dividedBy(new BigNumber(100));
      handleChangeCard({
        ...card,
        amount: realAmount.toNumber() < 1e-6 ? "0.000000" : realAmount.toString()
      })
    }
  }, [card, handleChangeCard, percentage, tokenBalance])

  const isDisabledInput = useMemo(() => {
    return disabled || card.token === null
  }, [disabled, card.token])

  const handleChangeToken = (token) => {
    const newToken = getTokenInfo(token.symbol.toLowerCase())
    handleChangeCard({ ...card, token: newToken })
  }

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^\d.-]/g, '')
    if (isNaN(parseFloat(value)) && value !== '') return
    handleChangeCard({ ...card, amount: value })
  }

  const value = useMemo(() => {
    const pointIdx = card.amount.indexOf('.')
    if (pointIdx > 0) {
      return card.amount.slice(0, pointIdx) + card.amount.slice(pointIdx, pointIdx + 7)
    }
    return card.amount
  }, [card.amount])

  return (
    <Paper className={classes.root}>
      <Box className={classes.main}>
        <DropDown
          value={card.token}
          options={tokens}
          onChange={handleChangeToken}
          inputProps={{ placeholder: 'token name, symbol' }}
          disableDrop={disableDrop}
        />
        <CurrencyInput
          name="currency"
          disabled={isDisabledInput}
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0.00"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={value}
          onChange={inputHandler}
        />
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.tokenBalance}>{`Balance: ${tokenBalance?.toString() ?? '--'}`}</Typography>
        <Typography className={classes.tokenBalance}>{amountPercentage}</Typography>
      </Box>
    </Paper>
  )
}

export default SwapCard
