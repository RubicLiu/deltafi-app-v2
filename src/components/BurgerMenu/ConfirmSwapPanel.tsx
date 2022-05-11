import { ReactElement, ReactNode, useMemo } from "react";
import { Box, IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { ConnectButton } from "components";

import { useModal } from "providers/modal";
import { getSwapOutAmount } from "utils/swap";
import { fixedNumber } from "utils/utils";
import { useSelector } from "react-redux";
import { selectMarketPriceByPool, selectSwapBySwapKey } from "states/selectors";
import { getPoolConfigBySymbols, PoolConfig } from "constants/deployConfigV2";

interface IConfirmSwapPanelProps {
  children?: ReactNode;
}

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  root: {
    background: palette.background.secondary,
    width: "100%",
    margin: "auto",
  },
  content: {
    marginTop: 32,
  },
  sectionDesktop: {
    display: "none",
    [breakpoints.up("md")]: {
      width: 450,
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    width: "auto",
    [breakpoints.up("md")]: {
      display: "none",
    },
  },
  img: {
    marginRight: 4,
    width: 24,
    height: 24,
    borderRadius: "50%",
  },
  bottomText: {
    marginBottom: 52,
    marginTop: 52,
    maxWidth: 400,
    textAlign: "center",
  },
  estimatedAmount: {
    marginBottom: 36,
  },
  row: {
    marginBottom: 24,
  },
  success: {
    color: palette.text.success,
  },
  priceImpact: {
    color: "#D4FF00",
  },
}));

const ConfirmSwapPanel = (props: IConfirmSwapPanelProps): ReactElement => {
  const classes = useStyles(props);
  const { setMenu, data } = useModal();

  const poolConfig: PoolConfig = getPoolConfigBySymbols(
    data?.tokenFrom.token.symbol,
    data?.tokenTo.token.symbol,
  );
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const { marketPrice, basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const swapOut = useMemo(() => {
    if (swapInfo && data) {
      const { tokenFrom, tokenTo, slippage } = data;
      return getSwapOutAmount(
        swapInfo,
        tokenFrom.token,
        tokenTo.token,
        tokenFrom.amount,
        parseFloat(slippage),
        marketPrice,
      );
    }
    return null;
  }, [data, marketPrice, swapInfo]);

  const exchangeRateLabel = useMemo(() => {
    if (basePrice && quotePrice && data) {
      if (data?.tokenFrom.token.symbol === data?.tokenTo.token.symbol) {
        return Number(basePrice / quotePrice).toFixed(6);
      } else if (data?.tokenFrom.token.symbol === data?.tokenTo.token.symbol) {
        return Number(quotePrice / basePrice).toFixed(6);
      }
    }
    return "-";
  }, [basePrice, quotePrice, data]);

  const minSwapOut = swapOut;

  const handleConfirm = () => {
    data?.callback();
    setMenu(false, "");
  };

  return (
    <Box width="100%">
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h5" color="textSecondary">
          Review Swap
        </Typography>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box className={classes.content}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          className={classes.estimatedAmount}
        >
          <Typography color="textSecondary" variant="body2">
            Estimated Received
          </Typography>
          <Typography>{`${fixedNumber(swapOut.amountOut) ?? 0} ${
            data?.tokenTo.token.symbol
          }`}</Typography>
        </Box>
        <Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Swap From</Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={data?.tokenFrom.token.logoURI}
                alt={`${data?.tokenFrom.token.symbol} coin`}
                className={classes.img}
              />
              <Typography>{`${data?.tokenFrom.amount ?? 0} ${
                data?.tokenFrom.token.symbol
              }`}</Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Minimum Received</Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={data?.tokenTo.token.logoURI}
                alt={`${data?.tokenTo.token.symbol} coin`}
                className={classes.img}
              />
              <Typography>{`${fixedNumber(minSwapOut.amountOut) ?? 0} ${
                data?.tokenTo.token.symbol
              }`}</Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Exchange Rate</Typography>
            <Typography color="primary" variant="body1">
              {`1 ${data?.tokenFrom.token.symbol} = ${exchangeRateLabel} ${data?.tokenTo.token.symbol}`}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Price impact</Typography>
            <Typography className={classes.priceImpact} variant="body1">
              {parseFloat(data?.slippage)}%
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Liquidity Provider Fee</Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={data?.tokenTo.token.logoURI}
                alt={`${data?.tokenFrom.token.symbol} coin`}
                className={classes.img}
              />
              <Typography>{`${fixedNumber(swapOut?.fee) ?? 0} ${
                data?.tokenTo.token.symbol
              }`}</Typography>
            </Box>
          </Box>
        </Box>
        <Typography color="textSecondary" className={classes.bottomText}>
          You may be asked to confirm the transaction via your wallet.
        </Typography>
      </Box>
      <Box>
        <ConnectButton fullWidth onClick={handleConfirm}>
          Confirm Swap
        </ConnectButton>
      </Box>
    </Box>
  );
};

export default ConfirmSwapPanel;
