import React, { useMemo } from "react";
import CurrencyInput from "react-currency-input-field";
import { makeStyles, Paper, Theme, Typography } from "@material-ui/core";

import { DropDown } from "components";
import { CardProps } from "./types";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { selectTokenAccountInfoByMint } from "states/selectors";
import { getTokenConfigBySymbol } from "constants/deployConfigV2";
import { anchorBnToBn } from "calculations/tokenUtils";
import { BN } from "@project-serum/anchor";
import { Box } from "@mui/material";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    width: "100%",
    background: palette.background.secondary,
    padding: spacing(2),
    [breakpoints.up("sm")]: {
      padding: `${spacing(2)}px ${spacing(3)}px`,
    },
    borderRadius: 16,
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
    fontFamily: "Rubik",
    marginLeft: spacing(3),
    [breakpoints.up("md")]: {
      fontSize: 24,
      "&.deposit": {
        fontSize: 20,
      },
    },
    "&::placeholder": {
      color: palette.text.primary,
    },
  },
  tokenBalance: {
    color: palette.text.dark,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1,
    [breakpoints.up("md")]: {
      fontSize: 14,
    },
  },
  tokenContainer: {
    padding: "8px 24px",
    borderRadius: 28,
    backgroundColor: palette.background.tertiary,
  },
}));

const SwapCard: React.FC<CardProps> = (props) => {
  const { card, handleChangeCard, disabled, tokens, disableDrop } = props;
  const classes = useStyles(props);
  const tokenAccount = useSelector(selectTokenAccountInfoByMint(card.token?.mint));

  const tokenBalance = useMemo(() => {
    if (tokenAccount && card) {
      return anchorBnToBn(card.token, new BN(tokenAccount.amount.toString()));
    }
    return null;
  }, [tokenAccount, card]);

  const isDisabledInput = useMemo(() => {
    return disabled || card.token === null;
  }, [disabled, card.token]);

  const handleChangeToken = (token) => {
    const newToken = getTokenConfigBySymbol(token.symbol);
    handleChangeCard({ ...card, token: newToken });
  };

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^\d.]/g, "");
    if (new BigNumber(value).isNaN() && value !== "") {
      return;
    } else if (value === "") {
      handleChangeCard({ ...card, amount: "" });
    } else {
      const valueToFixedDecimal = parseFloat(value).toFixed(card.token.decimals);
      handleChangeCard({
        ...card,
        amount: value.length > valueToFixedDecimal.length ? valueToFixedDecimal : value,
      });
    }
  };

  return (
    <Paper className={classes.root}>
      <Box className={classes.main}>
        <DropDown
          value={card.token}
          options={tokens}
          onChange={handleChangeToken}
          inputProps={{ placeholder: "token name, symbol" }}
          disableDrop={disableDrop}
        />
        <CurrencyInput
          name="currency"
          disabled={isDisabledInput}
          className={`${classes.currencyInput}`}
          autoComplete="off"
          placeholder="0"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.amount}
          onChange={inputHandler}
        />
      </Box>
      <Box display="flex">
        <Typography className={classes.tokenBalance}>Balance:&nbsp;</Typography>
        <Typography className={classes.tokenBalance} style={{ color: "#D4FF00" }}>
          {tokenBalance?.toString() || 0}&nbsp;
        </Typography>
        <Typography className={classes.tokenBalance}>{card?.token?.symbol}</Typography>
      </Box>
    </Paper>
  );
};

export default SwapCard;
