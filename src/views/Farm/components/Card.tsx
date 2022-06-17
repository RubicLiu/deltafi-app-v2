import React, { useMemo, memo } from "react";
import { Box, makeStyles } from "@material-ui/core";
import BigNumber from "bignumber.js";
import styled from "styled-components";

import { ConnectButton } from "components";
import { convertDollarSign as convertDollar, getTokenTvl, getUserTokenTvl } from "utils/utils";
import { CardProps } from "./types";
import { useSelector } from "react-redux";
import {
  selectGateIoSticker,
  selectMarketPriceByPool,
  selectFarmByFarmKey,
  selectSwapBySwapKey,
  selectFarmUserByFarmKey,
} from "states/selectors";

import { useModal } from "providers/modal";
import { anchorBnToBn } from "utils/tokenUtils";

const Img = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  &.coin-earning {
    margin-left: -1.2px;
  }
  border: 1px solid #d4ff00;
  background-color: ${({ theme }) => theme.palette.background.primary};
  ${({ theme }) => theme.muibreakpoints.up("sm")} {
    width: 60px;
    height: 60px;
    &.coin-earning {
      margin-left: -5px;
    }
  }
`;

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  container: {
    width: "256px",
    margin: "auto",
    backgroundColor: palette.background.primary,
    marginTop: spacing(3.5),
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
    [breakpoints.up("sm")]: {
      width: "296px",
    },
    lineHeight: 1,
  },
  header: {
    background: "url('/images/coin-card-banner.png')",
    backgroundSize: "cover",
    height: 80,
    position: "relative",
    "&.lime": {
      backgroundColor: "#D4FF00",
    },
    "&.greenYellow": {
      backgroundColor: "#03F2A0",
    },
    "&.indigo": {
      backgroundColor: "#693EFF",
    },
    "&.dodgerBlue": {
      backgroundColor: "#2F80ED",
    },
    "& div": {
      position: "absolute",
      left: "50%",
      top: "100%",
      transform: "translate(-50%, -70%)",
    },
  },
  content: {
    marginBottom: spacing(2.5),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(5),
    },
    marginTop: spacing(3.5),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  tokenPair: {
    fontSize: 18,
    fontWeight: 500,
    color: palette.primary.main,
    [breakpoints.up("sm")]: {
      fontSize: 20,
    },
  },
  label: {
    color: palette.text.primary,
    fontSize: 14,
    marginTop: 6,
    [breakpoints.up("sm")]: {
      fontSize: 18,
      fontWeight: 500,
    },
  },
  labelTitle: {
    fontSize: 12,
    [breakpoints.up("sm")]: {
      fontSize: 14,
    },
    fontWeight: 400,
    "&.lime": {
      color: "#D4FF00",
    },
    "&.greenYellow": {
      color: "#03F2A0",
    },
    "&.indigo": {
      color: "#693EFF",
    },
    "&.dodgerBlue": {
      color: "#2F80ED",
    },
  },
  cardBtn: {
    marginTop: "20px",
    height: "48px",
    width: "238px",
  },
}));

const PoolCard: React.FC<CardProps> = (props) => {
  const classes = useStyles(props);
  const { poolConfig, farmInfoAddress } = props;
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const farmInfo = useSelector(selectFarmByFarmKey(farmInfoAddress));
  const farmUser = useSelector(selectFarmUserByFarmKey(farmInfoAddress));
  const deltafiPrice = useSelector(selectGateIoSticker("DELFI_USDT"));

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const baseTvl = useMemo(() => {
    if (basePrice && swapInfo?.poolState) {
      return getTokenTvl(baseTokenInfo, swapInfo?.poolState.baseReserve, basePrice);
    }
    return new BigNumber(0);
  }, [basePrice, swapInfo, baseTokenInfo]);

  const quoteTvl = useMemo(() => {
    if (quotePrice && swapInfo) {
      return getTokenTvl(quoteTokenInfo, swapInfo?.poolState.quoteReserve, quotePrice);
    }
    return new BigNumber(0);
  }, [quotePrice, swapInfo, quoteTokenInfo]);
  const { setMenu } = useModal();

  // const tvl = baseTvl.plus(quoteTvl);

  const stakedTvl = useMemo(() => {
    if (swapInfo?.poolState && farmInfo) {
      const userBaseTvl = getUserTokenTvl(
        baseTvl,
        farmInfo.stakedBaseShare,
        swapInfo.poolState.baseSupply,
      );
      const userQuoteTvl = getUserTokenTvl(
        quoteTvl,
        farmInfo.stakedQuoteShare,
        swapInfo.poolState.quoteSupply,
      );
      return userBaseTvl.plus(userQuoteTvl);
    }
    return 0;
  }, [swapInfo, farmInfo, baseTvl, quoteTvl]);

  const userStakedTvl = useMemo(() => {
    if (swapInfo?.poolState && farmUser) {
      const userBaseTvl = getUserTokenTvl(
        baseTvl,
        farmUser.basePosition.depositedAmount,
        swapInfo.poolState.baseSupply,
      );
      const userQuoteTvl = getUserTokenTvl(
        quoteTvl,
        farmUser.quotePosition.depositedAmount,
        swapInfo.poolState.quoteSupply,
      );
      return userBaseTvl.plus(userQuoteTvl);
    }
    return new BigNumber(0);
  }, [baseTvl, quoteTvl, farmUser, swapInfo]);

  const apr = useMemo(() => {
    if (
      swapInfo?.poolState &&
      farmInfo &&
      quotePrice &&
      basePrice &&
      farmInfo?.farmConfig?.quoteAprDenominator.toNumber() > 0 &&
      farmInfo?.farmConfig?.baseAprDenominator.toNumber() > 0 &&
      deltafiPrice?.last
    ) {
      // reward from base per year if we have all the base share supply
      const baseRewardRateAllShare = anchorBnToBn(baseTokenInfo, swapInfo.poolState.baseSupply)
        .multipliedBy(farmInfo.farmConfig.baseAprNumerator.toString())
        .dividedBy(farmInfo.farmConfig.baseAprDenominator.toString())
        .multipliedBy(deltafiPrice.last);

      // reward from quote per year if we have all the quote share supply
      const quoteRewardRateAllShare = anchorBnToBn(quoteTokenInfo, swapInfo.poolState.quoteSupply)
        .multipliedBy(farmInfo.farmConfig.quoteAprNumerator.toString())
        .dividedBy(farmInfo.farmConfig.quoteAprDenominator.toString())
        .multipliedBy(deltafiPrice.last);

      const rewardRate = baseRewardRateAllShare
        .plus(quoteRewardRateAllShare)
        .dividedBy(baseTvl.plus(quoteTvl));

      return rewardRate.multipliedBy(100).toFixed(2);
    }

    return "--";
  }, [
    farmInfo,
    basePrice,
    quotePrice,
    baseTokenInfo,
    quoteTokenInfo,
    swapInfo?.poolState,
    deltafiPrice,
    baseTvl,
    quoteTvl,
  ]);

  return (
    <Box className={classes.container}>
      <Box className={`${classes.header} ${props.color || ""}`}>
        <div>
          <Img src={baseTokenInfo.logoURI} alt={`${baseTokenInfo.name} coin`} />
          <Img
            src={quoteTokenInfo.logoURI}
            alt={`${quoteTokenInfo.name} coin`}
            className="coin-earning"
          />
        </div>
      </Box>
      <Box className={classes.content}>
        <Box display="flex" alignItems="center" mb={2.5}>
          <Box>
            <Box className={classes.tokenPair}>{`${poolConfig.name}`}</Box>
          </Box>
        </Box>
        {props.isUserPool && (
          <Box marginBottom={1.25}>
            <Box className={`${classes.labelTitle} ${props.color || ""}`}>My Staked</Box>
            <Box className={classes.label}>{convertDollar(userStakedTvl.toFixed(2))}</Box>
          </Box>
        )}
        <Box>
          <Box className={`${classes.labelTitle} ${props.color || ""}`}>Total Staked</Box>
          <Box className={classes.label}>{convertDollar(stakedTvl.toFixed(2))}</Box>
        </Box>
        <Box marginTop={1.25}>
          <Box className={`${classes.labelTitle} ${props.color || ""}`}>APR</Box>
          <Box className={classes.label}>{apr}%</Box>
        </Box>
        <ConnectButton
          className={classes.cardBtn}
          onClick={() => setMenu(true, "stake", undefined, { farmInfo: farmInfoAddress })}
          variant={"outlined"}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs={`page: Pools, target: Deposit(${poolConfig.baseTokenInfo.symbol} - ${poolConfig.quoteTokenInfo.symbol})`}
        >
          {props.isUserPool ? "Manage" : "Stake"}
        </ConnectButton>
      </Box>
    </Box>
  );
};

export default memo(PoolCard);
