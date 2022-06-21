import React, { memo } from "react";
import { Box, makeStyles } from "@material-ui/core";
import styled from "styled-components";

import { ConnectButton } from "components";
import { convertDollarSign as convertDollar } from "utils/utils";
import { CardProps } from "./types";
import { useModal } from "providers/modal";

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

const FarmCard: React.FC<CardProps> = (props) => {
  const classes = useStyles(props);
  const { poolConfig, farmInfoAddress, totalStaked, userStaked, apr } = props;
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const { setMenu } = useModal();

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
            <Box className={classes.label}>{convertDollar(userStaked.toFixed(2))}</Box>
          </Box>
        )}
        <Box>
          <Box className={`${classes.labelTitle} ${props.color || ""}`}>Total Staked</Box>
          <Box className={classes.label}>{convertDollar(totalStaked.toFixed(2))}</Box>
        </Box>
        <Box marginTop={1.25}>
          <Box className={`${classes.labelTitle} ${props.color || ""}`}>APR</Box>
          <Box className={classes.label}>{apr.isNaN() ? "--" : apr.toFixed(2)}%</Box>
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

export default memo(FarmCard);
