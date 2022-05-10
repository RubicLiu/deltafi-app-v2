import React, { useMemo, useCallback, useEffect } from "react";
import {
  Typography,
  IconButton,
  makeStyles,
  Theme,
  Paper,
  Container,
  Box,
  Button as MUIButton,
  Snackbar,
  SnackbarContent,
  Link,
  Avatar,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { useWallet } from "@solana/wallet-adapter-react";
import { useParams } from "react-router";
import clx from "classnames";
import BigNumber from "bignumber.js";

import SwapCard from "views/Swap/components/Card";
import { ConnectButton } from "components";
import Page from "components/layout/Page";
import { SwapCard as ISwapCard } from "views/Swap/components/types";
import { WithdrawSelectCard } from "components/molecules";
import WithdrawCard from "components/molecules/WithdrawCard";

import { useModal } from "providers/modal";
import { exponentiatedBy } from "utils/decimal";
import { convertDollar, getTokenTvl } from "utils/utils";
import { SOLSCAN_LINK } from "constants/index";
import { PoolInformation } from "./PoolInformation";
import loadingIcon from "components/gif/loading_white.gif";
import { useDispatch, useSelector } from "react-redux";
import { getPoolConfigBySwapKey, deployConfigV2 } from "constants/deployConfigV2";
import {
  selectLpUserBySwapKey,
  selectMarketPriceByPool,
  selectSwapBySwapKey,
  selectTokenAccountInfoByMint,
  depositViewSelector,
  programSelector,
} from "states/selectors";
import { depositViewActions } from "states/views/depositView";
import { PublicKey, Transaction } from "@solana/web3.js";
import { sendSignedTransaction } from "utils/transactions";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { fetchSwapsThunk } from "states/accounts/swapAccount";
import { createDepositTransaction, createWithdrawTransaction } from "utils/transactions/deposit";
import { anchorBnToBn, stringToAnchorBn } from "utils/tokenUtils";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    margin: "0 auto",
    [breakpoints.up("sm")]: {
      maxWidth: 560,
    },
  },
  header: {
    marginBottom: 24,
  },
  root: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    marginBottom: spacing(3),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      padding: `${spacing(5)}px ${spacing(4)}px`,
      borderRadius: spacing(3),
      marginBottom: spacing(5),
      maxWidth: 560,
    },
  },
  stats: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    marginBottom: 40,
    [breakpoints.up("sm")]: {
      maxWidth: 560,
      borderRadius: spacing(3),
    },
  },
  tabs: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(3),
  },
  ratePanel: {
    display: "flex",
    flexDirection: "column",
    // marginBottom: 20,
  },
  statsPanel: {
    padding: `${spacing(3)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      padding: `${spacing(3)}px ${spacing(2)}px`,
    },
  },
  marketCondition: {
    fontWeight: "bold",
    marginBottom: spacing(3),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(4),
    },
  },
  iconGroup: {
    display: "flex",
    alignItems: "center",
  },
  coinIcon: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    [breakpoints.up("sm")]: {
      width: 28,
      height: 28,
    },
    boxShadow: "rgb(0 0 0 / 8%) 0px 6px 10px",
    color: "rgb(86, 90, 105)",
  },
  firstCoin: {
    marginRight: -5,
    zIndex: 1,
  },
  divider: {
    background: palette.primary.main,
    width: "100%",
    height: 0.5,
    opacity: 0.6,
    marginBottom: spacing(3),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(4),
    },
  },
  statsIcon: {
    marginRight: 20,
  },
  statsBottom: {
    background: palette.background.secondary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: spacing(2),
    [breakpoints.up("sm")]: {
      padding: spacing(2),
    },
  },
  snackBarContent: {
    maxWidth: 421,
    backgroundColor: palette.background.lightBlack,
    display: "flex",
    flexWrap: "unset",
    alignItems: "start",
  },
  snackBarIcon: {
    marginRight: spacing(2),
  },
  snackBarClose: {
    marginTop: 5,
  },
  snackBarLink: {
    color: palette.text.blue,
    cursor: "pointer",
    textDecoration: "none !important",
    marginLeft: spacing(1),
  },
  btn: {
    color: `${palette.secondary.main} !important`,
    fontWeight: "bold",
  },
  activeBtn: {
    color: `${palette.primary.main} !important`,
    fontWeight: "bold",
  },
  label: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 12,
    lineHeight: 1.2,
    color: "#f7f7f7",
    [breakpoints.up("sm")]: {
      fontSize: 16,
      lineHeight: 1,
    },
  },
  actionLoadingButton: {
    width: 50,
    height: 50,
    marginTop: 4,
    marginBottom: 4,
  },
}));

function getPairedTokenAmount(
  // TODO(ypeng): Find a way to import anchor enum type.
  swapType: any,
  amount: string,
  srcPrice: BigNumber,
  dstPrice: BigNumber,
) {
  const inputAmount = new BigNumber(amount);
  if (inputAmount.isZero() || inputAmount.isNaN()) {
    return "0";
  }

  if (swapType && swapType.stableSwap) {
    return amount;
  }

  return inputAmount.multipliedBy(srcPrice).dividedBy(dstPrice).toString();
}

const Deposit: React.FC = () => {
  const classes = useStyles();
  const { connected: isConnectedWallet } = useWallet();
  const { setMenu } = useModal();
  const { poolAddress } = useParams<{ poolAddress: string }>();
  const swapInfo = useSelector(selectSwapBySwapKey(poolAddress));
  const program = useSelector(programSelector);

  const poolConfig = getPoolConfigBySwapKey(poolAddress);
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const baseTokenAccount = useSelector(selectTokenAccountInfoByMint(baseTokenInfo.mint));
  const quoteTokenAccount = useSelector(selectTokenAccountInfoByMint(quoteTokenInfo.mint));

  const lpUser = useSelector(selectLpUserBySwapKey(poolAddress));
  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));
  const depositView = useSelector(depositViewSelector);
  const dispatch = useDispatch();
  const network = deployConfigV2.network;

  useEffect(() => {
    if (baseTokenInfo && quoteTokenInfo) {
      dispatch(depositViewActions.setTokenInfo({ baseTokenInfo, quoteTokenInfo }));
    }
  }, [baseTokenInfo, quoteTokenInfo, dispatch]);

  const baseTvl = useMemo(() => {
    if (basePrice && swapInfo) {
      return getTokenTvl(baseTokenInfo, swapInfo.poolState.baseReserve, basePrice);
    }
    return new BigNumber(0);
  }, [basePrice, swapInfo, baseTokenInfo]);

  const quoteTvl = useMemo(() => {
    if (quotePrice && swapInfo) {
      return getTokenTvl(quoteTokenInfo, swapInfo.poolState.quoteReserve, quotePrice);
    }
    return new BigNumber(0);
  }, [quotePrice, swapInfo, quoteTokenInfo]);

  const tvl = useMemo(() => {
    return baseTvl.plus(quoteTvl);
  }, [baseTvl, quoteTvl]);

  const basePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.baseShare)
        .plus(new BigNumber(lpUser.basePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.poolState.baseSupply))
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const quotePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.quoteShare)
        .plus(new BigNumber(lpUser.quotePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.poolState.quoteSupply))

        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const userBaseTvl = useMemo(() => {
    if (baseTvl && basePercent) {
      return baseTvl.multipliedBy(basePercent).dividedBy(100);
    }
    return new BigNumber(0);
  }, [baseTvl, basePercent]);

  const userQuoteTvl = useMemo(() => {
    if (quoteTvl && quotePercent) {
      return quoteTvl.multipliedBy(quotePercent).dividedBy(100);
    }
    return new BigNumber(0);
  }, [quoteTvl, quotePercent]);

  const userTvl = userBaseTvl.plus(userQuoteTvl);

  const baseShare = useMemo(() => {
    if (swapInfo && basePercent) {
      return anchorBnToBn(baseTokenInfo, swapInfo.poolState.baseReserve)
        .multipliedBy(basePercent)
        .dividedBy(100);
    }
    return new BigNumber(0);
  }, [swapInfo, basePercent, baseTokenInfo]);

  const quoteShare = useMemo(() => {
    if (swapInfo && quotePercent) {
      return anchorBnToBn(quoteTokenInfo, swapInfo.poolState.quoteReserve)
        .multipliedBy(quotePercent)
        .dividedBy(100);
    }
    return new BigNumber(0);
  }, [swapInfo, quotePercent, quoteTokenInfo]);

  const swapFee = useMemo(() => {
    if (swapInfo) {
      return new BigNumber(swapInfo.swapConfig.tradeFeeNumerator.toString())
        .dividedBy(swapInfo.swapConfig.tradeFeeDenominator.toString())
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [swapInfo]);

  const withdrawFee = useMemo(() => {
    if (swapInfo) {
      return new BigNumber(swapInfo.swapConfig.withdrawFeeNumerator.toString())
        .dividedBy(swapInfo.swapConfig.withdrawFeeDenominator.toString())
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [swapInfo]);

  const { publicKey: walletPubkey, signTransaction } = useWallet();
  const wallet = useWallet();

  const handleDeposit = useCallback(async () => {
    let transaction: Transaction;

    if (!swapInfo || !walletPubkey || !baseTokenAccount || !quoteTokenAccount || !program) {
      return null;
    }

    const connection = program.provider.connection;
    const base = depositView.base;
    const quote = depositView.quote;

    try {
      if (base.amount === "" || quote.amount === "") {
        return;
      }

      dispatch(depositViewActions.setIsProcessing({ isProcessing: true }));
      const baseAmount = stringToAnchorBn(poolConfig.baseTokenInfo, base.amount);
      const quoteAmount = stringToAnchorBn(poolConfig.quoteTokenInfo, quote.amount);
      transaction = await createDepositTransaction(
        program,
        connection,
        poolConfig,
        swapInfo,
        baseTokenAccount.publicKey,
        quoteTokenAccount.publicKey,
        walletPubkey,
        lpUser,
        baseAmount,
        quoteAmount,
      );

      const signedTransaction = await signTransaction(transaction);
      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");

      dispatch(depositViewActions.setTokenAmount({ baseAmount: "0", quoteAmount: "0" }));
      dispatch(
        depositViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            action: "deposit",
            hash,
            base,
            quote,
          },
        }),
      );
    } catch (e) {
      console.error("error", e);
      dispatch(
        depositViewActions.setTransactionResult({
          transactionResult: {
            status: false,
          },
        }),
      );
    } finally {
      dispatch(depositViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(depositViewActions.setIsProcessing({ isProcessing: false }));
      dispatch(
        fetchLiquidityProvidersThunk({
          connection,
          walletAddress: walletPubkey,
        }),
      );
      dispatch(
        fetchSwapsThunk({
          connection,
        }),
      );
    }
  }, [
    poolConfig,
    swapInfo,
    walletPubkey,
    baseTokenAccount,
    quoteTokenAccount,
    signTransaction,
    dispatch,
    lpUser,
    depositView,
    program,
  ]);

  const handleWithdraw = useCallback(async () => {
    let transaction: Transaction;

    if (!swapInfo || !walletPubkey || !baseTokenAccount || !quoteTokenAccount || !program) {
      return null;
    }

    const connection = program.provider.connection;
    const base = depositView.base;
    const quote = depositView.quote;
    try {
      if (base.amount === "" || quote.amount === "") {
        return;
      }
      dispatch(depositViewActions.setIsProcessing({ isProcessing: true }));

      const baseAmount = stringToAnchorBn(poolConfig.baseTokenInfo, base.amount);
      const quoteAmount = stringToAnchorBn(poolConfig.quoteTokenInfo, quote.amount);

      const program = getDeltafiDexV2(
        new PublicKey(deployConfigV2.programId),
        makeProvider(connection, wallet),
      );

      transaction = await createWithdrawTransaction(
        program,
        connection,
        poolConfig,
        swapInfo,
        baseTokenAccount.publicKey,
        quoteTokenAccount.publicKey,
        walletPubkey,
        baseAmount,
        quoteAmount,
      );

      transaction = await signTransaction(transaction);
      const hash = await sendSignedTransaction({
        signedTransaction: transaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");

      dispatch(depositViewActions.setTokenAmount({ baseAmount: "0", quoteAmount: "0" }));
      dispatch(
        depositViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            action: "withdraw",
            hash,
            base,
            quote,
          },
        }),
      );
    } catch (e) {
      console.error("error", e);
      dispatch(
        depositViewActions.setTransactionResult({
          transactionResult: {
            status: false,
          },
        }),
      );
    } finally {
      dispatch(depositViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(depositViewActions.setIsProcessing({ isProcessing: false }));
      dispatch(
        fetchLiquidityProvidersThunk({
          connection,
          walletAddress: walletPubkey,
        }),
      );
      dispatch(
        fetchSwapsThunk({
          connection,
        }),
      );
    }
  }, [
    wallet,
    poolConfig,
    swapInfo,
    walletPubkey,
    baseTokenAccount,
    quoteTokenAccount,
    signTransaction,
    dispatch,
    depositView,
    program,
  ]);

  const handleSnackBarClose = useCallback(() => {
    dispatch(depositViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const handleBaseTokenInput = useCallback(
    (card: ISwapCard) => {
      const baseAmount = card.amount;
      if (baseAmount === "") {
        dispatch(depositViewActions.setTokenAmount({ baseAmount: "0", quoteAmount: "0" }));
        return;
      }
      if (new BigNumber(baseAmount).isNaN()) {
        return;
      }

      const quoteAmount = getPairedTokenAmount(
        swapInfo.swapType,
        baseAmount,
        basePrice,
        quotePrice,
      );
      dispatch(depositViewActions.setTokenAmount({ baseAmount, quoteAmount }));
    },
    [basePrice, quotePrice, dispatch, swapInfo],
  );

  const handleQuoteTokenInput = useCallback(
    (card: ISwapCard) => {
      const quoteAmount = card.amount;
      if (quoteAmount === "") {
        dispatch(depositViewActions.setTokenAmount({ baseAmount: "0", quoteAmount: "0" }));
        return;
      }
      if (new BigNumber(quoteAmount).isNaN()) {
        return;
      }

      const baseAmount = getPairedTokenAmount(
        swapInfo.swapType,
        quoteAmount,
        quotePrice,
        basePrice,
      );
      dispatch(depositViewActions.setTokenAmount({ baseAmount, quoteAmount }));
    },
    [basePrice, quotePrice, dispatch, swapInfo],
  );

  const handleWithdrawSlider = useCallback(
    (value: number) => {
      if (lpUser && basePrice && quotePrice) {
        // TODO(ypeng): Consider price and pool ratio
        const baseAmount = anchorBnToBn(baseTokenInfo, lpUser.baseShare)
          .multipliedBy(value)
          .dividedBy(100);
        const quoteAmount = anchorBnToBn(quoteTokenInfo, lpUser.quoteShare)
          .multipliedBy(value)
          .dividedBy(100);
        dispatch(
          depositViewActions.setTokenAmount({
            baseAmount: baseAmount.toString(),
            quoteAmount: quoteAmount.toString(),
          }),
        );
      }
      dispatch(depositViewActions.setWithdrawPercentage({ withdrawPercentage: value }));
    },
    [dispatch, lpUser, baseTokenInfo, quoteTokenInfo, basePrice, quotePrice],
  );

  const handleSwitchMethod = useCallback(
    (method: string) => {
      dispatch(depositViewActions.setMethod({ method }));
    },
    [dispatch],
  );

  const snackMessasge = useMemo(() => {
    if (!depositView || !depositView.transactionResult) {
      return "";
    }

    if (!depositView.transactionResult.status) {
      return (
        <Box display="flex" alignItems="center">
          <img
            src={"/images/snack-fail.svg"}
            alt="snack-status-icon"
            className={classes.snackBarIcon}
          />
          <Box>
            <Typography variant="h6" color="primary">
              Transaction failed(try again later)
            </Typography>
            <Box>
              <Typography variant="body1" color="primary">
                failed to send transaction: Transaction simulation failed: Blockhash not found
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    const { base, quote, hash, action } = depositView.transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box>
          <Typography variant="body1" color="primary">
            {`${action.charAt(0).toUpperCase() + action.slice(1)} ${Number(base.amount).toFixed(
              6,
            )} ${base.token.symbol} and ${Number(quote.amount).toFixed(6)} ${
              quote.token.symbol
            } to ${base.token.symbol}-${quote.token.symbol} pool`}
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" color="primary">
              View Transaction:
            </Typography>
            <Link
              className={classes.snackBarLink}
              target="_blank"
              href={`${SOLSCAN_LINK}/tx/${hash}?cluster=${network}`}
            >
              {hash.slice(0, 7) + "..." + hash.slice(-7)}
            </Link>
          </Box>
        </Box>
      </Box>
    );
  }, [depositView, classes, network]);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose, classes]);

  const actionButton = useMemo(() => {
    if (!isConnectedWallet) {
      return (
        <ConnectButton size="large" fullWidth onClick={() => setMenu(true, "connect")}>
          Connect Wallet
        </ConnectButton>
      );
    }

    if (depositView.isProcessing) {
      return (
        <ConnectButton size="large" fullWidth variant="contained" disabled={true}>
          <Avatar className={classes.actionLoadingButton} src={loadingIcon} />
        </ConnectButton>
      );
    }
    const base = depositView.base;
    const quote = depositView.quote;
    if (depositView.method === "deposit") {
      if (base.token && quote.token && baseTokenAccount && quoteTokenAccount) {
        const isInsufficient =
          exponentiatedBy(baseTokenAccount.amount, base.token.decimals).isLessThan(
            new BigNumber(base.amount || 0),
          ) ||
          exponentiatedBy(quoteTokenAccount.amount, quote.token.decimals).isLessThan(
            new BigNumber(quote.amount),
          );
        if (isInsufficient) {
          return (
            <ConnectButton size="large" fullWidth disabled>
              Insufficient balance
            </ConnectButton>
          );
        }
      }
      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="contained"
          onClick={handleDeposit}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Deposit, target: Deposit"
        >
          Deposit
        </ConnectButton>
      );
    } else {
      if (base && quote && baseShare && quoteShare) {
        if (
          baseShare.isLessThan(new BigNumber(base.amount)) ||
          quoteShare.isLessThan(new BigNumber(quote.amount))
        ) {
          return (
            <ConnectButton size="large" fullWidth disabled>
              Insufficient balance
            </ConnectButton>
          );
        }
      }
      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="contained"
          onClick={handleWithdraw}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Withdraw, target: Withdraw"
        >
          Withdraw
        </ConnectButton>
      );
    }
  }, [
    depositView,
    isConnectedWallet,
    baseTokenAccount,
    baseShare,
    quoteTokenAccount,
    quoteShare,
    setMenu,
    handleDeposit,
    handleWithdraw,
    classes.actionLoadingButton,
  ]);

  if (!swapInfo) return null;

  const vertical = "bottom";
  const horizontal = "left";

  const reserveDisplay = (reserve: BigNumber, decimals: number): string => {
    if (!reserve || !decimals) {
      return "0";
    }

    const displayThreshold = 1;
    const value = exponentiatedBy(reserve, decimals);
    if (value.toNumber() < displayThreshold) {
      return value.toFormat(decimals);
    }
    return value.toFormat(2);
  };

  const method = depositView.method;

  return (
    <Page>
      <Container className={classes.container}>
        <Box display="flex" justifyContent="space-between" className={classes.header}>
          <Typography variant="h6" color="primary">
            {swapInfo.name}
          </Typography>
          <Box className={classes.iconGroup}>
            <img
              src={baseTokenInfo.logoURI}
              alt={`${baseTokenInfo.symbol} coin`}
              className={clx(classes.coinIcon, classes.firstCoin)}
            />
            <img
              src={quoteTokenInfo.logoURI}
              alt={`${quoteTokenInfo.symbol} coin`}
              className={classes.coinIcon}
            />
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" className={classes.header}>
          <Typography variant="body1" color="primary">
            Total Share
          </Typography>
          <Typography variant="body1" color="primary">
            {convertDollar(userTvl.toFixed(2).toString())}
          </Typography>
        </Box>
        <Paper className={classes.root}>
          <Box className={classes.ratePanel}>
            <Typography className={classes.marketCondition}>POSITION MANAGEMENT</Typography>
            <div className={classes.divider} />
            <Box className={classes.tabs}>
              <Box>
                <MUIButton
                  className={method === "deposit" ? classes.activeBtn : classes.btn}
                  onClick={() => handleSwitchMethod("deposit")}
                >
                  Deposit
                </MUIButton>
                &nbsp;
                <MUIButton
                  className={method === "withdraw" ? classes.activeBtn : classes.btn}
                  onClick={() => handleSwitchMethod("withdraw")}
                >
                  Withdraw
                </MUIButton>
              </Box>
            </Box>
          </Box>
          {method === "withdraw" ? (
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <WithdrawSelectCard
                percentage={depositView.withdrawPercentage}
                onUpdatePercentage={handleWithdrawSlider}
              />
              <WithdrawCard
                card={depositView.base}
                handleChangeCard={handleBaseTokenInput}
                withdrawal={baseShare?.toFixed(6).toString()}
                disableDrop={true}
              />
              <Box mt={1} />
              <WithdrawCard
                card={depositView.quote}
                handleChangeCard={handleQuoteTokenInput}
                withdrawal={quoteShare?.toFixed(6).toString()}
                disableDrop={true}
              />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <SwapCard
                card={depositView.base}
                handleChangeCard={handleBaseTokenInput}
                disableDrop={true}
              />
              <Box mt={1} />
              <SwapCard
                card={depositView.quote}
                handleChangeCard={handleQuoteTokenInput}
                disableDrop={true}
              />
            </Box>
          )}
          <Box mt={3} width="100%" sx={{ position: "relative", zIndex: 1 }}>
            {actionButton}
          </Box>
        </Paper>

        <Paper className={classes.stats}>
          <Box className={classes.statsPanel}>
            <Typography className={classes.marketCondition}>POOL STATS</Typography>
            <div className={classes.divider} />
            <Box display="flex" flexDirection="column">
              <Box display="flex" justifyContent="space-between">
                <Typography className={classes.label}>Currency Reserves</Typography>
                <Box marginBottom={2}>
                  <Box display="flex" marginBottom={1} alignItems="center" justifyContent="start">
                    <img
                      src={baseTokenInfo.logoURI}
                      alt={`${baseTokenInfo.symbol} coin`}
                      className={clx(classes.coinIcon, classes.statsIcon)}
                    />
                    <Typography className={classes.label}>
                      {`${reserveDisplay(swapInfo.poolState.baseReserve, baseTokenInfo.decimals)} ${
                        baseTokenInfo.symbol
                      }(${basePercent?.toFormat(2) || "-"}%)`}
                    </Typography>
                  </Box>
                  <Box display="flex">
                    <img
                      src={quoteTokenInfo.logoURI}
                      alt={`${quoteTokenInfo.symbol} coin`}
                      className={clx(classes.coinIcon, classes.statsIcon)}
                    />
                    <Typography className={classes.label}>
                      {`${reserveDisplay(
                        swapInfo.poolState.quoteReserve,
                        quoteTokenInfo.decimals,
                      )} ${quoteTokenInfo.symbol}(${quotePercent?.toFormat(2) || "-"}%)`}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between" marginBottom={2}>
                <Typography className={classes.label}>Total Reserves</Typography>
                <Typography className={classes.label}>
                  {convertDollar(tvl?.toFixed(2).toString())}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box className={classes.statsBottom}>
            <Box display="flex" justifyContent="space-between" marginBottom={1}>
              <Typography className={classes.label}>Swap Fee</Typography>
              <Typography className={classes.label}>{swapFee?.toString()}%</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography className={classes.label}>Withdraw Fee</Typography>
              <Typography className={classes.label}>{withdrawFee?.toString()}%</Typography>
            </Box>
          </Box>
        </Paper>

        <PoolInformation pool={poolConfig} />
      </Container>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={depositView.openSnackbar}
        onClose={handleSnackBarClose}
        key={vertical + horizontal}
      >
        <SnackbarContent
          aria-describedby="message-id2"
          className={classes.snackBarContent}
          message={snackMessasge}
          action={snackAction}
        />
      </Snackbar>
    </Page>
  );
};

export default Deposit;
