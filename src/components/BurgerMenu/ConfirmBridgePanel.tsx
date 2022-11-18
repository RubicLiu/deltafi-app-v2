import { ReactElement, ReactNode, useMemo } from "react";
import { IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { ConnectButton } from "components";
import { useModal } from "providers/modal";
import { calculateSwapOutResult } from "calculations/swapOutAmount";
import { fixedNumber } from "utils/utils";
import { useSelector } from "react-redux";
import { selectMarketPriceByPool, selectSwapBySwapKey } from "states/selectors";
import { getPoolConfigBySymbols, PoolConfig } from "constants/deployConfigV2";
import { Box } from "@mui/material";

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

const ConfirmBridgeSwapPanel = (props: IConfirmSwapPanelProps): ReactElement => {
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
      return calculateSwapOutResult(
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
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <Box position="relative">
                <img
                  src={data?.tokenFrom.token.logoURI}
                  alt={`${data?.tokenFrom.token.symbol} coin`}
                  className={classes.img}
                />
                {/* TODO: fill-in network logo URL */}
                <Box
                  component="img"
                  sx={{ height: 11, width: 11, position: "absolute", border: "1px solid #D4FF00" }}
                  borderRadius="50%"
                  src="data:image/png;base64,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"
                  top={12}
                  right={0}
                ></Box>
              </Box>
              <Box fontSize={16} fontWeight={500}>{`${fixedNumber(swapOut?.fee) ?? 0} ${
                data?.tokenTo.token.symbol
              }`}</Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography variant="body2" color="textSecondary">
              Mininum Received
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <Box position="relative">
                <img
                  src={data?.tokenFrom.token.logoURI}
                  alt={`${data?.tokenFrom.token.symbol} coin`}
                  className={classes.img}
                />
                {/* TODO: fill-in network logo URL */}
                <Box
                  component="img"
                  sx={{ height: 11, width: 11, position: "absolute", border: "1px solid #D4FF00" }}
                  borderRadius="50%"
                  src="/images/solana.png"
                  top={12}
                  right={0}
                ></Box>
              </Box>

              <Box fontSize={16} fontWeight={500}>{`${fixedNumber(swapOut?.fee) ?? 0} ${
                data?.tokenTo.token.symbol
              }`}</Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography variant="body2" color="textSecondary">
              Exchange Rate
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <Box fontSize={16} fontWeight={500}>
                {`${fixedNumber(swapOut?.fee) ?? 0} ${data?.tokenFrom.token.symbol} = ${
                  fixedNumber(swapOut?.fee) ?? 0
                } ${data?.tokenTo.token.symbol}`}
              </Box>
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
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography variant="body2" color="textSecondary">
              Liquidity Provider Fee
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={data?.tokenTo.token.logoURI}
                alt={`${data?.tokenFrom.token.symbol} coin`}
                className={classes.img}
              />
              <Box fontSize={16} fontWeight={500}>{`${fixedNumber(swapOut?.fee) ?? 0} ${
                data?.tokenTo.token.symbol
              }`}</Box>
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

export default ConfirmBridgeSwapPanel;
