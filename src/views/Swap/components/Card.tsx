import React, { useEffect, useMemo } from "react";
import CurrencyInput from "react-currency-input-field";
import { Box, makeStyles, Paper, Theme, Typography } from "@material-ui/core";

import { DropDown } from "components";
import { CardProps } from "./types";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { selectTokenAccountInfoByMint } from "states/selectors";
import { getTokenConfigBySymbol, TokenConfig } from "constants/deployConfigV2";
import { anchorBnToBn } from "utils/tokenUtils";
import { BN } from "@project-serum/anchor";

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

const SwapCard: React.FC<CardProps> = (props) => {
  const { card, handleChangeCard, disabled, tokens, disableDrop, percentage } = props;
  const classes = useStyles(props);
  const tokenAccount = useSelector(selectTokenAccountInfoByMint(card.token?.mint));

  const tokenBalance = useMemo(() => {
    if (tokenAccount && card) {
      return anchorBnToBn(card.token, new BN(tokenAccount.amount.toString()));
    }
    return null;
  }, [tokenAccount, card]);

  useEffect(() => {
    if (percentage && tokenBalance && card?.token?.decimals) {
      const minAmount: number = Number(`1e-${card.token.decimals}`);
      const zeroWithDecimals = `0.${"0".repeat(card.token.decimals)}`;
      const realAmount = tokenBalance
        .multipliedBy(new BigNumber(percentage))
        .dividedBy(new BigNumber(100));
      handleChangeCard({
        ...card,
        amount: realAmount.toNumber() < minAmount ? zeroWithDecimals : realAmount.toString(),
      });
    }
  }, [card, handleChangeCard, percentage, tokenBalance]);

  const isDisabledInput = useMemo(() => {
    return disabled || card.token === null;
  }, [disabled, card.token]);

  const handleChangeToken = (token) => {
    console.log(token);
    const newToken = getTokenConfigBySymbol(token.symbol);
    handleChangeCard({ ...card, token: newToken });
  };

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^\d.-]/g, "");
    if (new BigNumber(value).isNaN() && value !== "") {
      return;
    } else if (value === "") {
      handleChangeCard({ ...card, amount: "0" });
    } else {
      handleChangeCard({ ...card, amount: value });
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
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0.00"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.amount}
          onChange={inputHandler}
        />
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography className={classes.tokenBalance}>{`Balance: ${
          tokenBalance?.toString() ?? "--"
        }`}</Typography>
      </Box>
    </Paper>
  );
};

export default SwapCard;
