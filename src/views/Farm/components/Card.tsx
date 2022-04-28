import React, { useMemo } from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { Box, makeStyles, Theme, Typography } from "@material-ui/core";
import BigNumber from "bignumber.js";

import { exponentiate, exponentiatedBy } from "utils/decimal";
import { ConnectButton, Text } from "components";
import { CardProps } from "./types";
import { PMM } from "lib/calc";
import { convertDollar } from "utils/utils";

import { useSelector } from "react-redux";
import { selectMarketPriceByPool, selectFarmByFarmKey, selectSwapBySwapKey } from "states/v2/selectorsV2";
import { getTokenConfigBySymbol } from "constants/deployConfig";

const deltafiTokenDecimals = 6;

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    background: palette.background.secondary,
    padding: spacing(2),
    marginBottom: spacing(2),
    borderRadius: 16,
    [breakpoints.up("md")]: {
      padding: `${spacing(3)}px ${spacing(2.5)}px`,
    },
  },
  content: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(2),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(3.5),
    },
  },
  label: {
    fontFamily: "Inter",
    color: "#F7F7F7",
    fontWeight: 400,
    fontSize: 12,
    [breakpoints.up("sm")]: {
      fontSize: 16,
      fontWeight: 500,
    },
  },
  tokenPair: {
    marginLeft: spacing(1.5),
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    color: palette.primary.main,
    [breakpoints.up("sm")]: {
      fontSize: 18,
    },
  },
}));

const Img = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  &.coin-earning {
    margin-left: -1.2px;
  }
  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    width: 32px;
    height: 32px;
    &.coin-earning {
      margin-left: -5px;
    }
  }
`;

const FarmCard: React.FC<CardProps> = (props) => {
  const classes = useStyles(props);
  const history = useHistory();
  const { poolConfig } = props;
  const baseTokenInfo = getTokenConfigBySymbol(poolConfig.base);
  const quoteTokenInfo = getTokenConfigBySymbol(poolConfig.quote);
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const farmInfo = useSelector(selectFarmByFarmKey(poolConfig?.farmInfo));

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const tvl = useMemo(() => {
//    if (swapPool && farmPool && basePrice && quotePrice && pmm) {
//      return pmm
//        .tvl(
//          basePrice,
//          quotePrice,
//          swapPool.baseTokenInfo.decimals,
//          swapPool.quoteTokenInfo.decimals,
//        )
//        .multipliedBy(farmPool.reservedAmount.toString())
//        .dividedBy(swapPool.poolState.totalSupply);
//    }
    return 0;
  }, [swapInfo, farmInfo, basePrice, quotePrice]);

  const apr = useMemo(() => {
//    if (farmInfo && basePrice) {
//      const rawApr = exponentiatedBy(
//        exponentiate(
//          new BigNumber(farmInfo.aprNumerator.toString()).div(
//            new BigNumber(farmInfo.aprDenominator.toString()),
//          ),
//          swapInfo.baseTokenInfo.decimals,
//        ),
//        deltafiTokenDecimals,
//      );
//
//      return rawApr.dividedBy(basePrice).multipliedBy(100).toFixed(2);
//    }
    return 0;
  }, [farmInfo, swapInfo, basePrice, quoteTokenInfo]);

  if (!swapInfo || !farmInfo) return null;

  const [firstTokenInfo, secondTokenInfo] = [baseTokenInfo, quoteTokenInfo];

  return (
    <Box className={classes.root}>
      <Box className={classes.content}>
        <Box display="flex" alignItems="center">
          <Img src={firstTokenInfo.logoURI} alt={`${firstTokenInfo.symbol} coin`} />
          <Img
            src={secondTokenInfo.logoURI}
            alt={`${secondTokenInfo.symbol} coin`}
            className="coin-earning"
          />
          <Text className={classes.tokenPair}>{`${poolConfig.name}`}</Text>
        </Box>
        <ConnectButton
          onClick={() => history.push(`/stake/${poolConfig.farmInfo}`)}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs={`page: Farms, target: Deposit(${poolConfig.name})`}
        >
          STAKE
        </ConnectButton>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.label}>Total Staked:</Typography>
        <Typography className={classes.label}>{convertDollar(tvl.toFixed(2))}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mt={1.5}>
        <Typography className={classes.label}>APR</Typography>
        <Typography className={classes.label}>{apr}%</Typography>
      </Box>
    </Box>
  );
};

export default FarmCard;
