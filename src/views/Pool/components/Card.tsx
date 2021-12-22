import React, { useMemo, memo } from 'react'
import { useHistory } from 'react-router-dom'
import { Box, makeStyles, Typography } from '@material-ui/core'
import { useWallet } from '@solana/wallet-adapter-react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'

import { ConnectButton } from 'components'
import { usePoolFromAddress } from 'providers/pool'
import { useTokenFromMint, useTokenMintAccount } from 'providers/tokens'
import { usePriceBySymbol } from 'providers/pyth'
import { PMM } from 'lib/calc'
import { convertDoller } from 'utils/utils'
import { rate } from 'utils/decimal'
import { CardProps } from './types'

const Img = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  &.coin-earning {
    margin-left: -1.2px;
  }
  ${({ theme }) => theme.muibreakpoints.up('sm')} {
    width: 32px;
    height: 32px;
    &.coin-earning {
      margin-left: -5px;
    }
  }
`

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  container: {
    width: '100%',
    background: palette.background.secondary,
    padding: spacing(2),
    borderRadius: 8,
    [breakpoints.up('sm')]: {
      padding: `${spacing(3)}px ${spacing(2.5)}px`,
      borderRadius: 16,
    },
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
    [breakpoints.up('sm')]: {
      marginBottom: spacing(3.5),
    },
  },
  tokenPair: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 500,
    color: palette.primary.main,
    [breakpoints.up('sm')]: {
      fontSize: 18,
    },
  },
  label: {
    fontFamily: 'Inter',
    color: '#F7F7F7',
    fontWeight: 400,
    fontSize: 12,
    [breakpoints.up('sm')]: {
      fontSize: 16,
      fontWeight: 500,
    },
  },
}))

const PoolCard: React.FC<CardProps> = (props) => {
  const history = useHistory()
  const { connected } = useWallet()
  const classes = useStyles()
  const { poolKey } = props
  const pool = usePoolFromAddress(poolKey)
  const { price: basePrice } = usePriceBySymbol(pool?.baseTokenInfo.symbol)
  const { price: quotePrice } = usePriceBySymbol(pool?.quoteTokenInfo.symbol)
  const poolTokenAccount = useTokenFromMint(pool?.poolMintKey.toBase58())
  const poolMint = useTokenMintAccount(pool?.poolMintKey)

  const pmm = useMemo(() => {
    if (pool) {
      return new PMM(pool.poolState)
    }
    return null
  }, [pool])

  const tvl = useMemo(() => {
    if (pmm && basePrice && quotePrice) {
      return pmm.tvl(basePrice, quotePrice)
    }
    return new BigNumber(0)
  }, [pmm, basePrice, quotePrice])

  const share = useMemo(() => {
    if (pool && poolTokenAccount && poolMint) {
      return rate(poolTokenAccount.account.amount, poolMint.supply)
    }
    return 0
  }, [pool, poolTokenAccount, poolMint])

  const sharePrice = useMemo(() => {
    if (pmm && basePrice && quotePrice) {
      return pmm.tvl(basePrice, quotePrice).multipliedBy(share).div(100)
    }
    return new BigNumber(0)
  }, [pmm, basePrice, quotePrice, share])

  if (!pool) return null

  return (
    <Box className={classes.container}>
      <Box className={classes.content}>
        <Box display="flex" alignItems="center">
          <Img src={pool.baseTokenInfo.logoURI} alt={`${pool.baseTokenInfo.name} coin`} />
          <Img src={pool.quoteTokenInfo.logoURI} alt={`${pool.quoteTokenInfo.name} coin`} className="coin-earning" />
          <Box ml={1.5}>
            <Typography className={classes.tokenPair}>
              {`${pool.baseTokenInfo.symbol} - ${pool.quoteTokenInfo.symbol}`}
            </Typography>
          </Box>
        </Box>
        <ConnectButton
          onClick={() => history.push(`/deposit/${pool.publicKey.toBase58()}`)}
          variant={props.isUserPool ? 'contained' : 'outlined'}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs={`page: Pools, target: Deposit(${pool.baseTokenInfo.symbol} - ${pool.quoteTokenInfo.symbol})`}
        >
          {props.isUserPool ? 'MANAGE' : 'DEPOSIT'}
        </ConnectButton>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.label}>Total Deposits</Typography>
        <Typography className={classes.label}>{convertDoller(tvl.toString())}</Typography>
      </Box>
      {connected && props.isUserPool && (
        <Box display="flex" justifyContent="space-between">
          <Typography className={classes.label}>Your deposits</Typography>
          <Typography className={classes.label}>{convertDoller(sharePrice?.toString())}</Typography>
        </Box>
      )}
    </Box>
  )
}

export default memo(PoolCard)
