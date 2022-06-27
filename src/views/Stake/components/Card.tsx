import React from "react";
import CurrencyInput from "react-currency-input-field";
import { Box, makeStyles, Paper, Theme } from "@material-ui/core";

import { CardProps } from "./types";
import { Avatar } from "@mui/material";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    width: "100%",
    background: palette.background.secondary,
    padding: spacing(2),
    borderRadius: 16,
    [breakpoints.up("md")]: {
      padding: `${spacing(2.5)}px ${spacing(3)}px`,
    },
  },
  main: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    [breakpoints.up("md")]: {
      marginBottom: 16,
    },
  },
  ratePanel: {
    display: "flex",
    justifyContent: "space-between",
  },
  topSection: {
    display: "flex",
    justifyContent: "space-between",
  },
  tokenSection: {},
  infoSection: {
    display: "flex",
    justifyContent: "space-between",
  },
  token: {
    marginLeft: spacing(2),
  },
  tokenSymbol: {
    fontSize: 10,
  },
  currencyInput: {
    color: palette.text.primary,
    textAlign: "right",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    fontWeight: 400,
    width: "100%",
    flex: 1,
    marginLeft: spacing(3),
    [breakpoints.up("md")]: {
      fontSize: 24,
      fontWeight: 500,
    },
    "&::placeholder": {
      color: palette.text.primary,
    },
  },
  tokenBalance: {
    color: palette.text.dark,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: 500,
    [breakpoints.up("md")]: {
      fontSize: 16,
    },
  },
  tokenContainer: {
    padding: "8px 24px",
    borderRadius: 28,
    backgroundColor: palette.background.tertiary,
  },
  tabs: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(2),
    textTransform: "none",
    "& .MuiButton-text": {
      padding: 0,
    },
    "& .MuiButton-root": {
      minWidth: 0,
      borderRadius: 3,
      marginRight: 20,
    },
    "& .MuiButton-label": {
      fontSize: 20,
      fontWeight: 500,
      lineHeight: 1,
      fontFamily: "Rubik",
      textTransform: "none",
    },
  },
  btn: {
    color: `${palette.secondary.main} !important`,
    fontWeight: "bold",
  },
  activeBtn: {
    color: `${palette.primary.main} !important`,
    fontWeight: "bold",
  },
}));

const StakeCard: React.FC<CardProps> = (props) => {
  const { poolConfig, card } = props;
  const classes = useStyles(props);

  return (
    <Paper className={classes.root}>
      <Box className={classes.main}>
        <Box
          bgcolor="#1c1c1c"
          display="flex"
          sx={{
            padding: "8px 24px 8px 24px",
            borderRadius: 28,
            boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
            alignItems: "center",
          }}
        >
          <Avatar
            src={poolConfig.baseTokenInfo.logoURI}
            sx={{
              borderRadius: "100%",
              border: "1px solid #BDFF00",
              width: 30,
              height: 30,
            }}
          ></Avatar>
          <Box ml={1} fontSize={16}>
            {poolConfig.baseTokenInfo.symbol}
          </Box>
        </Box>
        <CurrencyInput
          name="currency"
          disabled={true}
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.baseSelectedAmount}
        />
      </Box>

      <Box display="flex" fontSize={12} fontWeight={500} margin={1}>
        <Box>Staked / Deposited:&nbsp;</Box>
        <Box sx={{ color: "#D4FF00" }}>
          {`${card.baseStakedAmount || 0} / ${card.baseTotalAmount || 0}`}&nbsp;
        </Box>
      </Box>

      <Box className={classes.main}>
        <Box
          bgcolor="#1c1c1c"
          display="flex"
          sx={{
            padding: "8px 24px 8px 24px",
            borderRadius: 28,
            boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
            alignItems: "center",
          }}
        >
          <Avatar
            src={poolConfig.quoteTokenInfo.logoURI}
            sx={{
              borderRadius: "100%",
              border: "1px solid #BDFF00",
              width: 30,
              height: 30,
            }}
          ></Avatar>
          <Box ml={1} fontSize={16}>
            {poolConfig.quoteTokenInfo.symbol}
          </Box>
        </Box>
        <CurrencyInput
          name="currency"
          disabled={true}
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.quoteSelectedAmount}
        />
      </Box>

      <Box display="flex" fontSize={12} fontWeight={500} margin={1}>
        <Box>Staked / Deposited:&nbsp;</Box>
        <Box sx={{ color: "#D4FF00" }}>
          {`${card.quoteStakedAmount || 0} / ${card.quoteTotalAmount || 0}`}&nbsp;
        </Box>
      </Box>
    </Paper>
  );
};

export default StakeCard;
