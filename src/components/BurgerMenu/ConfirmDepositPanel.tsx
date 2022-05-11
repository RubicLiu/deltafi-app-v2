import { ReactNode } from "react";
import { Box, IconButton, makeStyles, Theme, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

// import { useModal } from "providers/modal";
import { ConnectButton } from "components";
import { getPoolConfigBySwapKey } from "constants/deployConfigV2";

interface IDepositPanelProps {
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
    marginTop: 40,
    textAlign: "center",
    color: "#f6f6f6",
    fontSize: 12,
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
  left: {
    fontSize: "14px",
    color: "#D3D3D3",
  },
  btn: {
    height: 72,
    background: "linear-gradient(#D4FF00,#BDFF00)",
    fontSize: 20,
    fontWeight: 600,
  },
}));

const ConfirmDepositPanel: React.FC<IDepositPanelProps> = (props: IDepositPanelProps) => {
  const classes = useStyles();
  // const { address, setMenu } = useModal();
  const { address, onClose, onConfirm } = props;
  const poolConfig = getPoolConfigBySwapKey(address);
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  // const poolTokenAccount = useSelector(selectTokenAccountInfoByMint(pool?.poolMintKey.toBase58()));

  // const { marketPrice, basePrice, quotePrice } = useSelector(selectMarketPriceByPool(pool));

  // const share = useMemo(() => {
  //   if (pool && poolTokenAccount) {
  //     return rate(poolTokenAccount.amount, pool.poolState.totalSupply);
  //   }
  //   return 0;
  // }, [pool, poolTokenAccount]);

  // if (!pool) return null;

  const handleDeposit = () => {
    onConfirm();
    // setMenu(false, "");
    // handle deposit
  };

  return (
    <div className={classes.paper}>
      <Box display="flex" justifyContent="space-between" className={classes.header}>
        <Typography variant="h5" color="primary">
          Review Deposit
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
            Total Deposit
          </Typography>
          <Typography>${"0.00"?.toString() || 0}</Typography>
        </Box>
        <Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography className={classes.left} color="textSecondary">
              Deposit Currencies
            </Typography>
            <Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={baseTokenInfo.logoURI}
                  alt={`${baseTokenInfo.symbol} coin`}
                  className={classes.img}
                />
                <Typography>{0} USDC</Typography>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={quoteTokenInfo.logoURI}
                  alt={`${quoteTokenInfo.symbol} coin`}
                  className={classes.img}
                />
                <Typography>{0} USDT</Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography className={classes.left} color="textSecondary">
              New Pool Share
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={baseTokenInfo.logoURI}
                alt={`${baseTokenInfo.symbol} coin`}
                className={classes.img}
              />
              <Typography>{0} USDC</Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography className={classes.left} color="textSecondary">
              Estimated lP tokens received
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <Box color="#D4FF00">{0} USDC</Box>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" className={classes.row}>
            <Typography className={classes.left} color="textSecondary">
              Price Impact
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <Typography className={classes.success}>{0} %</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box>
        <ConnectButton className={classes.btn} fullWidth onClick={handleDeposit}>
          Confirm Deposit
        </ConnectButton>
      </Box>
      <Typography color="primary" className={classes.bottomText}>
        You may be asked to confirm the transaction via your wallet.
      </Typography>
    </div>
  );
};

export default ConfirmDepositPanel;
