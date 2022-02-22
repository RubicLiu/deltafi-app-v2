import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useHistory } from 'react-router-dom'
import { Box, makeStyles, Theme, Typography } from '@material-ui/core'
import BigNumber from 'bignumber.js'

import { ConnectButton, Text } from 'components'
import { CardProps } from './types'
import { PMM } from 'lib/calc'
import { convertDoller } from 'utils/utils'
import { usePoolFromAddress } from 'providers/pool'
import { usePriceBySymbol } from 'providers/pyth'
import { useTokenMintAccount } from 'providers/tokens'
import { useFarmPoolByAddress } from 'providers/farm'

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    background: palette.background.secondary,
    padding: spacing(2),
    marginBottom: spacing(2),
    borderRadius: 16,
    [breakpoints.up('md')]: {
      padding: `${spacing(3)}px ${spacing(2.5)}px`,
    },
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
    [breakpoints.up('sm')]: {
      marginBottom: spacing(3.5),
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
  tokenPair: {
    marginLeft: spacing(1.5),
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 500,
    color: palette.primary.main,
    [breakpoints.up('sm')]: {
      fontSize: 18,
    },
  },
}))

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

const FarmCard: React.FC<CardProps> = (props) => {
  const classes = useStyles(props)
  const history = useHistory()
  const { farm } = props
  const swapPool = usePoolFromAddress(farm?.poolAddress)
  const farmPool = useFarmPoolByAddress(farm?.address.toBase58())
  const lpMint = useTokenMintAccount(swapPool?.poolMintKey)
  const { price: basePrice } = usePriceBySymbol(swapPool?.baseTokenInfo.symbol)
  const { price: quotePrice } = usePriceBySymbol(swapPool?.quoteTokenInfo.symbol)

  const pmm = useMemo(() => {
    if (swapPool) {
      return new PMM(swapPool.poolState)
    }
    return null
  }, [swapPool])

  const tvl = useMemo(() => {
    if (swapPool && farmPool && basePrice && quotePrice && lpMint && pmm) {
      return pmm.tvl(basePrice, quotePrice, swapPool.baseTokenInfo.decimals, swapPool.quoteTokenInfo.decimals).multipliedBy(farmPool.reservedAmount.toString()).dividedBy(lpMint.supply)
    }
    return 0
  }, [swapPool, farmPool, basePrice, quotePrice, pmm, lpMint])

  const apy = useMemo(() => {
    if (farmPool) {
      const apr = new BigNumber(farmPool.aprNumerator.toString()).div(new BigNumber(farmPool.aprDenominator.toString()))
      return new BigNumber(1).plus(apr.dividedBy(365)).pow(365).minus(1).multipliedBy(100).toFixed(2)
    }
    return 0
  }, [farmPool])

  if (!swapPool || !farmPool) return null

  return (
    <Box className={classes.root}>
      <Box className={classes.content}>
        <Box display="flex" alignItems="center">
          <Img src={swapPool.baseTokenInfo.logoURI} alt={`${swapPool.baseTokenInfo.symbol} coin`} />
          <Img
            src={swapPool.quoteTokenInfo.logoURI}
            alt={`${swapPool.quoteTokenInfo.symbol} coin`}
            className="coin-earning"
          />
          <Text className={classes.tokenPair}>
            {`${swapPool.baseTokenInfo.symbol} - ${swapPool.quoteTokenInfo.symbol}`}
          </Text>
        </Box>
        <ConnectButton
          onClick={() => history.push(`/stake/${farm.address.toBase58()}`)}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs={`page: Farms, target: Deposit(${swapPool.baseTokenInfo.symbol} - ${swapPool.quoteTokenInfo.symbol})`}
        >
          STAKE
        </ConnectButton>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.label}>Total Staked:</Typography>
        <Typography className={classes.label}>{convertDoller(tvl)}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mt={1.5}>
        <Typography className={classes.label}>APY</Typography>
        <Typography className={classes.label}>{apy}%</Typography>
      </Box>
    </Box>
  )
}

export default FarmCard
