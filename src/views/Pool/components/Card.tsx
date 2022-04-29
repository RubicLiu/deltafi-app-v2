import React, { useMemo, memo } from "react";
import { useHistory } from "react-router-dom";
import { Box, makeStyles, Typography } from "@material-ui/core";
import { useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import styled from "styled-components";

import { ConnectButton } from "components";
import { convertDollar, getTokenTvl } from "utils/utils";
import { CardProps } from "./types";
import { useSelector } from "react-redux";
import {
  selectLpUserBySwapKey,
  selectSwapBySwapKey,
  selectMarketPriceByPool,
} from "states/v2/selectorsV2";

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

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  container: {
    width: "100%",
    background: palette.background.secondary,
    marginBottom: spacing(2),
    borderRadius: 8,
    [breakpoints.up("sm")]: {
      padding: `${spacing(3)}px ${spacing(2.5)}px`,
      borderRadius: 16,
    },
  },
  content: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: spacing(2),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(3.5),
    },
  },
  tokenPair: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    color: palette.primary.main,
    [breakpoints.up("sm")]: {
      fontSize: 18,
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
}));

const PoolCard: React.FC<CardProps> = (props) => {
  const history = useHistory();
  const { connected } = useWallet();
  const classes = useStyles();
  const { poolConfig } = props;

  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig.swapInfo));
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

  const sharePrice = useMemo(() => {
    if (swapInfo && lpUser) {
      const userBaseTvl = baseTvl
        .multipliedBy(new BigNumber(lpUser.baseShare))
        .dividedBy(new BigNumber(swapInfo.poolState.baseSupply.toString()));
      const userQuoteTvl = quoteTvl
        .multipliedBy(new BigNumber(lpUser.quoteShare))
        .dividedBy(new BigNumber(swapInfo.poolState.quoteSupply.toString()));
      return userBaseTvl.plus(userQuoteTvl);
    }
    return new BigNumber(0);
  }, [baseTvl, quoteTvl, lpUser, swapInfo]);

  const stakingPrice = useMemo(() => {
    if (swapInfo && lpUser) {
      const userBaseTvl = baseTvl
        .multipliedBy(new BigNumber(lpUser.basePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.poolState.baseSupply.toString()));
      const userQuoteTvl = quoteTvl
        .multipliedBy(new BigNumber(lpUser.quotePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.poolState.quoteSupply.toString()));
      return userBaseTvl.plus(userQuoteTvl);
    }
    return new BigNumber(0);
  }, [baseTvl, quoteTvl, lpUser, swapInfo]);

  if (!swapInfo) return null;

  return (
    <Box className={classes.container}>
      <Box className={classes.content}>
        <Box display="flex" alignItems="center">
          <Img src={baseTokenInfo.logoURI} alt={`${baseTokenInfo.name} coin`} />
          <Img
            src={quoteTokenInfo.logoURI}
            alt={`${quoteTokenInfo.name} coin`}
            className="coin-earning"
          />
          <Box ml={1.5}>
            <Typography className={classes.tokenPair}>{`${poolConfig.name}`}</Typography>
          </Box>
        </Box>
        <ConnectButton
          onClick={() => history.push(`/deposit/${poolConfig.swapInfo}`)}
          variant={props.isUserPool ? "contained" : "outlined"}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs={`page: Pools, target: Deposit(${swapInfo.name})`}
        >
          {props.isUserPool ? "MANAGE" : "DEPOSIT"}
        </ConnectButton>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.label}>Total Deposits</Typography>
        <Typography className={classes.label}>
          {convertDollar(tvl.toFixed(2).toString())}
        </Typography>
      </Box>
      {connected && props.isUserPool && (
        <Box display="flex" justifyContent="space-between">
          <Typography className={classes.label}>Your deposits</Typography>
          <Typography className={classes.label}>
            {convertDollar(sharePrice?.toFixed(2).toString())}
          </Typography>
        </Box>
      )}
      {connected && props.isUserPool && stakingPrice && (
        <Box display="flex" justifyContent="space-between">
          <Typography className={classes.label}>Your staking</Typography>
          <Typography className={classes.label}>
            {convertDollar(stakingPrice?.toFixed(2).toString())}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default memo(PoolCard);
