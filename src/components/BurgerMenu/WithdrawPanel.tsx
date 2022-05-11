import { ReactElement, ReactNode } from "react";
import { Box, IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { ConnectButton } from "components";

import { getPoolConfigBySwapKey } from "constants/deployConfigV2";

interface IWithdrawPanelProps {
  children?: ReactNode;
  address?: string;
  onClose?: Function;
  onConfirm?: Function;
}

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  header: {},
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
  paper: {
    backgroundColor: palette.background.primary,
    padding: `${spacing(3)}px ${spacing(2)}px`,
    borderRadius: spacing(2),
    [breakpoints.up("sm")]: {
      borderRadius: spacing(3),
      padding: `${spacing(5)}px ${spacing(4)}px`,
      minWidth: 380,
    },
    width: 520,
    margin: "auto",
    fontSize: "16px",
    fontWeight: 500,
  },
  btn: {
    height: 72,
    background: "linear-gradient(#D4FF00,#BDFF00)",
    fontSize: 20,
    fontWeight: 600,
  },
}));

const WithdrawPanel = (props: IWithdrawPanelProps): ReactElement => {
  const { address, onClose, onConfirm } = props;
  const pool = getPoolConfigBySwapKey(address);
  const classes = useStyles(props);

  const handleWithdraw = () => {
    onConfirm();
    // handle withdraw
  };

  if (!pool) return null;

  return (
    <div className={classes.paper}>
      <Box display="flex" justifyContent="space-between" className={classes.header}>
        <Typography variant="h6" color="primary">
          Review Withdraw
        </Typography>
        <IconButton size="small" onClick={() => onClose()}>
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
            Total Withdraw
          </Typography>
          <Typography>${0}</Typography>
        </Box>
        <Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Withdraw Currencies</Typography>
            <Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={pool.baseTokenInfo.logoURI}
                  alt={`${pool.baseTokenInfo.symbol} coin`}
                  className={classes.img}
                />
                <Typography>{0} USDC</Typography>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={pool.quoteTokenInfo.logoURI}
                  alt={`${pool.quoteTokenInfo.symbol} coin`}
                  className={classes.img}
                />
                <Typography>{0} USDT</Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">New Pool Share</Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={pool.baseTokenInfo.logoURI}
                alt={`${pool.baseTokenInfo.symbol} coin`}
                className={classes.img}
              />
              <Typography>{0} USDC</Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography color="textSecondary">Withdraw Currencies</Typography>
            <Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={pool.baseTokenInfo.logoURI}
                  alt={`${pool.baseTokenInfo.symbol} coin`}
                  className={classes.img}
                />
                <Typography>{0} USDC</Typography>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={pool.quoteTokenInfo.logoURI}
                  alt={`${pool.quoteTokenInfo.symbol} coin`}
                  className={classes.img}
                />
                <Typography>{0} USDT</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box>
        <ConnectButton className={classes.btn} fullWidth onClick={handleWithdraw}>
          Confirm Withdraw
        </ConnectButton>
      </Box>
      <Typography color="primary" className={classes.bottomText}>
        You may be asked to confirm the transaction via your wallet.
      </Typography>
    </div>
  );
};

export default WithdrawPanel;
