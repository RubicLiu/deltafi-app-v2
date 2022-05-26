import { ReactElement, ReactNode, useMemo } from "react";
import { Box, IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { ConnectButton } from "components";

import { useModal } from "providers/modal";
import { getSwapOutResult } from "utils/swap";
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
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: 30,
    maxWidth: 400,
    textAlign: "center",
    fontSize: 12,
  },
  estimatedAmount: {
    marginBottom: 36,
  },
  row: {
    marginBottom: 16,
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
  const { marketPrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const swapOut = useMemo(() => {
    if (swapInfo && data) {
      const { tokenFrom, tokenTo, slippage } = data;
      return getSwapOutResult(
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

  const handleConfirm = () => {
    data?.callback();
    setMenu(false, "");
  };

  return (
    <Box width="100%" minWidth={{ md: 460 }}>
      <Box display="flex" justifyContent="space-between">
        <Box color="#F6F6F6" fontSize={20} fontWeight={500}>
          Review Swap
        </Box>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box pb={0.5} className={classes.content}>
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
          <Box fontSize={16} fontWeight={500}>{`${fixedNumber(swapOut.amountOut) ?? 0} ${
            data?.tokenTo.token.symbol
          }`}</Box>
        </Box>
        <Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography variant="body2" color="textSecondary">
              Swap From
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={data?.tokenFrom.token.logoURI}
                alt={`${data?.tokenFrom.token.symbol} coin`}
                className={classes.img}
              />
              <Box fontSize={16} fontWeight={500}>{`${data?.tokenFrom.amount ?? 0} ${
                data?.tokenFrom.token.symbol
              }`}</Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography variant="body2" color="textSecondary">
              Transaction Fee
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={data?.tokenTo.token.logoURI}
                alt={`${data?.tokenFrom.token.symbol} coin`}
                className={classes.img}
              />
              <Box>{`${fixedNumber(swapOut?.fee) ?? 0} ${data?.tokenTo.token.symbol}`}</Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography variant="body2" color="textSecondary">
              Price impact
            </Typography>
            <Box fontSize={16} fontWeight={500} className={classes.priceImpact}>
              {data?.priceImpact ?? "--"}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box mt={0.5}>
        <ConnectButton size="large" fullWidth onClick={handleConfirm}>
          Confirm Swap
        </ConnectButton>
      </Box>
      <Box color="#F6F6F6" className={classes.bottomText}>
        You may be asked to confirm the transaction via your wallet.
      </Box>
    </Box>
  );
};

export default ConfirmSwapPanel;
