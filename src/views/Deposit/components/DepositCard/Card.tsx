import React, { useMemo } from "react";
import CurrencyInput from "react-currency-input-field";
// import Box from "@material-ui/core/Box";
import { Box } from "@mui/material";
import Paper from "@material-ui/core/Paper";
import clx from "classnames";

import { DropDown } from "components";
import useStyles from "./styles";
import { DepositCardProps } from "./types";
import { tokenConfigs } from "constants/deployConfigV2";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { selectTokenAccountInfoByMint } from "states";
import { anchorBnToBn } from "calculations/tokenUtils";
import BN from "bn.js";

const DepositCard: React.FC<DepositCardProps> = (props) => {
  const { card, disableDrop, withdrawal, handleChangeCard, isDeposit } = props;
  const classes = useStyles(props);

  const tokenAccount = useSelector(selectTokenAccountInfoByMint(card.token?.mint));

  const tokenBalance = useMemo(() => {
    if (tokenAccount && card) {
      return anchorBnToBn(card.token, new BN(tokenAccount.amount.toString()));
    }
    return null;
  }, [tokenAccount, card]);

  const handleChangeToken = (_) => {};

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^\d.]/g, "");
    if (new BigNumber(value).isNaN() && value !== "") {
      return;
    } else if (value === "") {
      handleChangeCard({ ...card, amount: "0" });
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
      <Box display="flex" justifyContent="space-between" marginBottom={2}>
        <DropDown
          value={card.token}
          options={tokenConfigs}
          disableDrop={disableDrop}
          onChange={handleChangeToken}
          inputProps={{ placeholder: "token name, symbol" }}
        />
        <CurrencyInput
          name="currency"
          className={classes.currencyInput}
          autoComplete="off"
          placeholder="0.00"
          minLength={0}
          maxLength={20}
          decimalsLimit={20}
          value={card.amount}
          onChange={isDeposit ? inputHandler : null}
        />
      </Box>
      <Box display="flex" justifyContent="space-between" flexWrap="wrap" columnGap={3}>
        {isDeposit ? (
          <Box display="flex">
            <Box className={classes.tokenBalance}>Balance:&nbsp;</Box>
            <Box className={clx(classes.tokenBalance, classes.withdrawNumber)}>
              {tokenBalance?.toString() || "--"}&nbsp;
            </Box>
            <Box className={classes.tokenBalance}>{card.token?.symbol}</Box>
          </Box>
        ) : (
          <Box display="flex">
            <Box className={classes.tokenBalance}>Max Withdrawal:&nbsp;</Box>
            <Box className={clx(classes.tokenBalance, classes.withdrawNumber)}>
              {withdrawal || 0}&nbsp;
            </Box>
            <Box className={classes.tokenBalance}>{card.token?.symbol}</Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DepositCard;
