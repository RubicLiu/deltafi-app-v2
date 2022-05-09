import React from "react";
import CurrencyInput from "react-currency-input-field";
import { Box, makeStyles, Paper, Theme, Typography } from "@material-ui/core";

import { DropDown } from "components";
import { CardProps } from "./types";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    width: "100%",
    background: palette.background.secondary,
    padding: spacing(2),
    borderRadius: 16,
    [breakpoints.up("md")]: {
      padding: `${spacing(3)}px ${spacing(2.5)}px`,
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
}));

const StakeCard: React.FC<CardProps> = (props) => {
  const { poolConfig, card, tokens, disableDrop } = props;
  const classes = useStyles(props);

  const inputHandler = (_: React.ChangeEvent<HTMLInputElement>) => {};
  const baseDecimals = poolConfig.baseTokenInfo.decimals;
  const baseBalance = card.baseBalance.toFixed(baseDecimals);
  const baseStaked = card.baseStaked.toFixed(baseDecimals);
  const quoteDecimals = poolConfig.quoteTokenInfo.decimals;
  const quoteBalance = card.quoteBalance.toFixed(quoteDecimals);
  const quoteStaked = card.quoteStaked.toFixed(quoteDecimals);

  return (
    <Paper className={classes.root}>
      <Box className={classes.main}>
        <DropDown
          value={poolConfig.baseTokenInfo}
          options={tokens}
          inputProps={{ placeholder: "token name, symbol" }}
          disableDrop={disableDrop}
        />
        <CurrencyInput
          name="currency"
          disabled={true}
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0.00"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.baseAmount}
          onChange={inputHandler}
        />
      </Box>
      <Box className={classes.main}>
        <DropDown
          value={poolConfig.quoteTokenInfo}
          options={tokens}
          inputProps={{ placeholder: "token name, symbol" }}
          disableDrop={disableDrop}
        />
        <CurrencyInput
          name="currency"
          disabled={true}
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0.00"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.quoteAmount}
          onChange={inputHandler}
        />
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography
          className={classes.tokenBalance}
        >{`Staked base share: ${baseStaked}/${baseBalance}`}</Typography>
        <Typography
          className={classes.tokenBalance}
        >{`Staked quote share: ${quoteStaked}/${quoteBalance}`}</Typography>
      </Box>
    </Paper>
  );
};

export default StakeCard;
