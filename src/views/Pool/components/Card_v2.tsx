import React, { useMemo, memo } from "react";
import { Box, makeStyles, Typography } from "@material-ui/core";
import BigNumber from "bignumber.js";
import styled from "styled-components";

import { ConnectButton } from "components";
import { convertDollarSign as convertDollar, getTokenTvl } from "utils/utils";
import { CardProps } from "./types";
import { useSelector } from "react-redux";
import { useModal } from "providers/modal";
import {
  selectSwapBySwapKey,
  selectMarketPriceByPool,
  selectLpUserBySwapKey,
} from "states/selectors";

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
  //   const history = useHistory();
  //   const { connected } = useWallet();
  const classes = useStyles();
  const { setMenu } = useModal();
  const { poolConfig } = props;

  const lpUser = useSelector(selectLpUserBySwapKey(poolConfig.swapInfo));
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig.swapInfo));
  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const totalTradeVolume = useMemo(() => {
    if (basePrice && quotePrice && swapInfo && baseTokenInfo && quoteTokenInfo) {
      const baseVolume = getTokenTvl(baseTokenInfo, swapInfo.poolState.totalTradedBase, basePrice);
      const quoteVolume = getTokenTvl(
        quoteTokenInfo,
        swapInfo.poolState.totalTradedQuote,
        quotePrice,
      );
      return baseVolume.plus(quoteVolume);
    }
    return new BigNumber(0);
  }, [basePrice, quotePrice, swapInfo, baseTokenInfo, quoteTokenInfo]);

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

  const basePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.baseShare)
        .plus(new BigNumber(lpUser.basePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.poolState.baseSupply.toString()))
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const quotePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.quoteShare)
        .plus(new BigNumber(lpUser.quotePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.poolState.quoteSupply.toString()))

        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const userBaseTvl = useMemo(() => {
    if (baseTvl && basePercent) {
      return baseTvl.multipliedBy(basePercent).dividedBy(100);
    }
    return new BigNumber(0);
  }, [baseTvl, basePercent]);

  const userQuoteTvl = useMemo(() => {
    if (quoteTvl && quotePercent) {
      return quoteTvl.multipliedBy(quotePercent).dividedBy(100);
    }
    return new BigNumber(0);
  }, [quoteTvl, quotePercent]);

  const userTvl = userBaseTvl.plus(userQuoteTvl);

  if (!swapInfo) return null;
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
            <Typography className={classes.tokenPair}>{`${poolConfig.name}`}</Typography>
          </Box>
        </Box>
        {props.isUserPool && (
          <Box marginTop={1}>
            <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
              My Deposit
            </Typography>
            <Typography className={classes.label}>{convertDollar(userTvl.toFixed(2))}</Typography>
          </Box>
        )}
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
            Total Deposits
          </Typography>
          <Typography className={classes.label}>
            {convertDollar(tvl.toFixed(2).toString())}
          </Typography>
        </Box>
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
            Total Volume
          </Typography>
          <Typography className={classes.label}>
            {convertDollar(tvl.toFixed(2).toString())}
          </Typography>
        </Box>
        <Box marginTop={1}>
          <Typography className={`${classes.labelTitle} ${props.color || ""}`}>
            Total trade volume
          </Typography>
          <Typography className={classes.label}>
            {convertDollar(totalTradeVolume.toFixed(2).toString())}
          </Typography>
        </Box>
        <ConnectButton
          className={classes.cardBtn}
          onClick={() => setMenu(true, "deposit", undefined, { poolAddress: poolConfig.swapInfo })}
          variant="outlined"
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs={`page: Pools, target: Deposit(${baseTokenInfo.symbol} - ${quoteTokenInfo.symbol})`}
        >
          {props.isUserPool ? "Manage" : "Deposit"}
        </ConnectButton>
      </Box>
    </Box>
  );
};

export default memo(PoolCard);
