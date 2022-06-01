import React, { useMemo, memo } from "react";
// import { useHistory } from "react-router-dom";
import { Box, makeStyles, Typography } from "@material-ui/core";
// import { useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import styled from "styled-components";

import { ConnectButton } from "components";
import { convertDollarSign as convertDollar, getTokenTvl, getUserTokenTvl } from "utils/utils";
import { CardProps } from "./types";
import { useSelector } from "react-redux";
import {
  selectMarketPriceByPool,
  selectFarmByFarmKey,
  selectSwapBySwapKey,
  selectFarmUserByFarmKey,
} from "states/selectors";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { useHistory } from "react-router";

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

const deltafiTokenDecimals = 6;

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
  },
  header: {
    background: "url('/images/coin-card-banner.png')",
    backgroundSize: "cover",
    height: 90,
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
      transform: "translate(-50%, -50%)",
    },
  },
  content: {
    marginBottom: spacing(3.5),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(7),
    },
    marginTop: spacing(4.5),
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
    marginTop: "28px",
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
  const history = useHistory();

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const baseTvl = useMemo(() => {
    if (basePrice && swapInfo) {
      return getTokenTvl(baseTokenInfo, swapInfo.poolState.baseReserve, basePrice);
    }
    return new BigNumber(0);
  }, [basePrice, swapInfo, baseTokenInfo]);

  const quoteTvl = useMemo(() => {
    if (quotePrice && swapInfo) {
      return getTokenTvl(quoteTokenInfo, swapInfo.poolState.quoteReserve, quotePrice);
    }
    return new BigNumber(0);
  }, [quotePrice, swapInfo, quoteTokenInfo]);

  const tvl = baseTvl.plus(quoteTvl);

  const stakedTvl = useMemo(() => {
    if (swapInfo && farmInfo) {
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
    if (swapInfo && farmUser) {
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

  const [firstTokenInfo, secondTokenInfo] = [baseTokenInfo, quoteTokenInfo];

  return (
    <Box className={classes.container}>
      <Box className={`${classes.header} ${props.color || ""}`}>
        <div>
          <Img src={firstTokenInfo.logoURI} alt={`${firstTokenInfo.name} coin`} />
          <Img
            src={secondTokenInfo.logoURI}
            alt={`${secondTokenInfo.name} coin`}
            className="coin-earning"
          />
        </div>
      </Box>
      <Box className={classes.content}>
        <Box display="flex" alignItems="center" mb={2.5}>
          <Box>
            <Typography className={classes.tokenPair}>{`${poolConfig.name}`}</Typography>
          </Box>
        </Box>
        {/* {props.isUserPool && (
          <>
            <Box marginTop={1}>
              <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
                My Staked
              </Typography>
              <Typography className={classes.label}>{convertDollar(tvl.toFixed(2))}</Typography>
            </Box>
            <Box marginTop={1}>
              <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
                My Reward Rate
              </Typography>
              <Typography className={classes.label}>{baseApr} DLT / Day</Typography>
            </Box>
          </>
        )} */}

        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>TVL</Typography>
          <Typography className={classes.label}>{convertDollar(tvl.toFixed(2))}</Typography>
        </Box>
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
            Total Staking
          </Typography>
          <Typography className={classes.label}>{convertDollar(stakedTvl.toFixed(2))}</Typography>
        </Box>
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
            Your Staking
          </Typography>
          <Typography className={classes.label}>
            {convertDollar(userStakedTvl.toFixed(2))}
          </Typography>
        </Box>
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>Base APR</Typography>
          <Typography className={classes.label}>{baseApr}%</Typography>
        </Box>
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
            Quote APR
          </Typography>
          <Typography className={classes.label}>{quoteApr}%</Typography>
        </Box>
        <ConnectButton
          className={classes.cardBtn}
          onClick={() => {
            history.push(`/stake/${farmInfoAddress}`)
          }}
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
