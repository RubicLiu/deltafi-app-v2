import React, { useMemo } from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { Box, makeStyles, Theme, Typography } from "@material-ui/core";
import BigNumber from "bignumber.js";

import { exponentiate, exponentiatedBy } from "utils/decimal";
import { ConnectButton, Text } from "components";
import { CardProps } from "./types";
import { convertDollar, getTokenTvl, getUserTokenTvl } from "utils/utils";

import { useSelector } from "react-redux";
import {
  selectMarketPriceByPool,
  selectFarmByFarmKey,
  selectSwapBySwapKey,
  selectLpUserBySwapKey,
} from "states/selectors";

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
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const farmInfo = useSelector(selectFarmByFarmKey(poolConfig?.farmInfo));
  const lpUser = useSelector(selectLpUserBySwapKey(poolConfig.swapInfo));

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const baseTvl = useMemo(() => {
    if (basePrice && swapInfo) {
      return getTokenTvl(
        swapInfo.poolState.baseReserve.toNumber(),
        baseTokenInfo.decimals,
        basePrice,
      );
    }
    return new BigNumber(0);
  }, [basePrice, swapInfo, baseTokenInfo]);

  const quoteTvl = useMemo(() => {
    if (quotePrice && swapInfo) {
      return getTokenTvl(
        swapInfo.poolState.quoteReserve.toNumber(),
        quoteTokenInfo.decimals,
        quotePrice,
      );
    }
    return new BigNumber(0);
  }, [quotePrice, swapInfo, quoteTokenInfo]);

  const tvl = baseTvl.plus(quoteTvl);

  const stakedTvl = useMemo(() => {
    if (swapInfo && farmInfo) {
      const userBaseTvl = getUserTokenTvl(
        baseTvl,
        new BigNumber(farmInfo.stakedBaseShare.toString()),
        new BigNumber(swapInfo.poolState.baseSupply.toString()),
      );
      const userQuoteTvl = getUserTokenTvl(
        quoteTvl,
        new BigNumber(farmInfo.stakedQuoteShare.toString()),
        new BigNumber(swapInfo.poolState.quoteSupply.toString()),
      );
      return userBaseTvl.plus(userQuoteTvl);
    }
    return 0;
  }, [swapInfo, farmInfo, baseTvl, quoteTvl]);

  const userStakedTvl = useMemo(() => {
    if (swapInfo && lpUser) {
      const userBaseTvl = getUserTokenTvl(
        baseTvl,
        new BigNumber(lpUser.basePosition.depositedAmount.toString()),
        new BigNumber(swapInfo.poolState.baseSupply.toString()),
      );
      const userQuoteTvl = getUserTokenTvl(
        quoteTvl,
        new BigNumber(lpUser.quotePosition.depositedAmount.toString()),
        new BigNumber(swapInfo.poolState.quoteSupply.toString()),
      );
      return userBaseTvl.plus(userQuoteTvl);
    }
    return new BigNumber(0);
  }, [baseTvl, quoteTvl, lpUser, swapInfo]);

  const baseApr = useMemo(() => {
    if (farmInfo && basePrice && farmInfo.farmConfig.baseAprDenominator.toNumber() > 0) {
      const rawApr = exponentiatedBy(
        exponentiate(
          new BigNumber(farmInfo.farmConfig.baseAprNumerator.toString()).div(
            new BigNumber(farmInfo.farmConfig.baseAprDenominator.toString()),
          ),
          baseTokenInfo.decimals,
        ),
        deltafiTokenDecimals,
      );
      return rawApr.dividedBy(basePrice).multipliedBy(100).toFixed(2);
    }
    return 0;
  }, [farmInfo, basePrice, baseTokenInfo]);

  const quoteApr = useMemo(() => {
    if (farmInfo && quotePrice && farmInfo.farmConfig.quoteAprDenominator.toNumber() > 0) {
      const rawApr = exponentiatedBy(
        exponentiate(
          new BigNumber(farmInfo.farmConfig.quoteAprNumerator.toString()).div(
            new BigNumber(farmInfo.farmConfig.quoteAprDenominator.toString()),
          ),
          quoteTokenInfo.decimals,
        ),
        deltafiTokenDecimals,
      );
      return rawApr.dividedBy(quotePrice).multipliedBy(100).toFixed(2);
    }
    return 0;
  }, [farmInfo, quotePrice, quoteTokenInfo]);

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
        <Typography className={classes.label}>TVL:</Typography>
        <Typography className={classes.label}>{convertDollar(tvl.toFixed(2))}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.label}>Total Staking:</Typography>
        <Typography className={classes.label}>{convertDollar(stakedTvl.toFixed(2))}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.label}>Your Staking:</Typography>
        <Typography className={classes.label}>{convertDollar(userStakedTvl.toFixed(2))}</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mt={1.5}>
        <Typography className={classes.label}>Base APR</Typography>
        <Typography className={classes.label}>{baseApr}%</Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mt={1.5}>
        <Typography className={classes.label}>Quote APR</Typography>
        <Typography className={classes.label}>{quoteApr}%</Typography>
      </Box>
    </Box>
  );
};

export default FarmCard;
