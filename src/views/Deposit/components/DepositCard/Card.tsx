import React, { useMemo } from "react";
import CurrencyInput from "react-currency-input-field";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import clx from "classnames";

import { DropDown } from "components";
import useStyles from "./styles";
import { DepositCardProps } from "./types";
import { tokenConfigs } from "constants/deployConfigV2";

const DepositCard: React.FC<DepositCardProps> = (props) => {
  const { card, disableDrop, withdrawal } = props;
  const classes = useStyles(props);

  const inputHandler = (_) => {};
  const handleChangeToken = (_) => {};

  const value = useMemo(() => {
    const pointIdx = card.amount.indexOf(".");
    if (pointIdx > 0) {
      return card.amount.slice(0, pointIdx) + card.amount.slice(pointIdx, pointIdx + 7);
    }
    return card.amount;
  }, [card.amount]);

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
          value={value}
          onChange={inputHandler}
        />
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex">
          <Box className={classes.tokenBalance}>Max Withdrawal:&nbsp;</Box>
          <Box className={clx(classes.tokenBalance, classes.withdrawNumber)}>
            {withdrawal || 0}&nbsp;
          </Box>
          <Box className={classes.tokenBalance}>{card.token?.symbol}</Box>
        </Box>
        <Box className={classes.tokenBalance}>
          Total: {"00.00"} {"Symbol"} ({0}%)
        </Box>
      </Box>
    </Paper>
  );
};

export default DepositCard;
