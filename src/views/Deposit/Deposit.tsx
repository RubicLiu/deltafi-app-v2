import React, { useMemo, useCallback, useEffect, useState } from "react";
import {
  Typography,
  IconButton,
  makeStyles,
  Theme,
  Box,
  Button as MUIButton,
  Snackbar,
  SnackbarContent,
  Link,
  Divider,
  CircularProgress,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import BigNumber from "bignumber.js";

import SwapCard from "views/Swap/components/Card";
import { ConnectButton } from "components";
import { SwapCard as ISwapCard } from "views/Swap/components/types";
import { WithdrawSelectCard } from "components/molecules";
import WithdrawCard from "components/molecules/WithdrawCard";

import { useModal } from "providers/modal";
import { exponentiatedBy } from "utils/decimal";
import { convertDollarSign as convertDollar, getTokenTvl } from "utils/utils";
import { SECONDS_PER_YEAR, SOLSCAN_LINK } from "constants/index";
import { useHistory } from "react-router-dom";
// import { PoolInformation } from "./PoolInformation";
import { useDispatch, useSelector } from "react-redux";
import {
  getPoolConfigBySwapKey,
  deployConfigV2,
  DELTAFI_TOKEN_DECIMALS,
} from "constants/deployConfigV2";
import {
  selectLpUserBySwapKey,
  selectMarketPriceByPool,
  selectSwapBySwapKey,
  selectTokenAccountInfoByMint,
  depositViewSelector,
  programSelector,
} from "states/selectors";
import { depositViewActions } from "states/views/depositView";
import { Transaction } from "@solana/web3.js";
import { sendSignedTransaction } from "utils/transactions";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { fetchSwapsThunk } from "states/accounts/swapAccount";
import { createDepositTransaction, createWithdrawTransaction } from "utils/transactions/deposit";
import { anchorBnToBn, stringCutTokenDecimals, stringToAnchorBn } from "utils/tokenUtils";
import { LiquidityProvider, SwapInfo } from "anchor/type_definitions";
import { Paper } from "@material-ui/core";
import { createClaimFarmRewardsTransaction } from "utils/transactions/stake";
import BN from "bn.js";
import { scheduleWithInterval } from "utils";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    margin: "0 auto",
    [breakpoints.up("sm")]: {
      maxWidth: 560,
    },
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
    marginBottom: spacing(2.5),
    marginTop: spacing(2),
    fontSize: 16,
    textTransform: "none",
    "& .MuiButton-text": {
      padding: 0,
    },
    "& .MuiButton-root": {
      minWidth: 0,
      borderRadius: 3,
      marginRight: 20,
    },
    "& .MuiButton-label": {
      fontSize: 16,
      textTransform: "none",
      fontWeight: 500,
    },
  },
  ratePanel: {
    display: "flex",
    flexDirection: "column",
    marginTop: 12,
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
    flexDirection: "column",
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
    background: palette.background.black,
    border: "1px solid #d4ff00",
  },
  firstCoin: {
    marginTop: -5,
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
    paddingTop: spacing(2),
    fontSize: 12,
    gap: 18,
    [breakpoints.up("sm")]: {
      paddingTop: spacing(3),
    },
  },
  snackBarContent: {
    maxWidth: 393,
    backgroundColor: palette.background.lightBlack,
    display: "flex",
    flexWrap: "unset",
    alignItems: "center",
  },
  snackBarIcon: {
    marginRight: spacing(2),
  },
  snackBarClose: {
    marginTop: 5,
  },
  snackBarLink: {
    color: palette.text.success,
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
    marginTop: 4,
    marginBottom: 4,
  },
  modalContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    overflow: "auto",
  },
  error: {
    textAlign: "center",
    color: "#F60505",
    marginBottom: "24px",
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

const Deposit: React.FC<{ poolAddress?: string }> = (props) => {
  const history = useHistory();
  const classes = useStyles();
  const { connected: isConnectedWallet } = useWallet();
  const { setMenu, data } = useModal();
  let poolAddress = props.poolAddress;
  let isRouterModal = false;
  if (poolAddress) isRouterModal = true;
  if (data) poolAddress = data.poolAddress;
  const swapInfo: SwapInfo = useSelector(selectSwapBySwapKey(poolAddress));
  const program = useSelector(programSelector);

  const poolConfig = getPoolConfigBySwapKey(poolAddress);
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;
  const baseTokenAccount = useSelector(selectTokenAccountInfoByMint(baseTokenInfo.mint));
  const quoteTokenAccount = useSelector(selectTokenAccountInfoByMint(quoteTokenInfo.mint));
  const rewardsAccount = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));

  const lpUser: LiquidityProvider = useSelector(selectLpUserBySwapKey(poolAddress));
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
      return new BigNumber(lpUser.baseShare.toString())
        .plus(new BigNumber(lpUser.basePosition.depositedAmount.toString()))
        .dividedBy(new BigNumber(swapInfo.poolState.baseSupply.toString()))
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const quotePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.quoteShare.toString())
        .plus(new BigNumber(lpUser.quotePosition.depositedAmount.toString()))
        .dividedBy(new BigNumber(swapInfo.poolState.quoteSupply.toString()))

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

  const cumulativeInterest: string = useMemo(() => {
    if (lpUser) {
      return exponentiatedBy(
        lpUser.basePosition.cumulativeInterest
          .add(lpUser.quotePosition.cumulativeInterest)
          .toString(),
        DELTAFI_TOKEN_DECIMALS,
      ).toFixed(DELTAFI_TOKEN_DECIMALS);
    }
    return "--";
  }, [lpUser]);

  // update reward every 5 seconds
  useEffect(
    () =>
      scheduleWithInterval(() => {
        dispatch(depositViewActions.updateCurrentUnixTimestamp());
      }, 5 * 1000),
    [],
  );

  console.log(depositView.currentUnixTimestamp);
  const unclaimedInterest = useMemo(() => {
    if (lpUser && swapInfo?.swapConfig) {
      const totalOwedInterest = exponentiatedBy(
        lpUser.basePosition.rewardsOwed.add(lpUser.quotePosition.rewardsOwed).toString(),
        DELTAFI_TOKEN_DECIMALS,
      );

      const secondsFromBaseLastUpdate = new BN(depositView.currentUnixTimestamp).sub(
        lpUser.basePosition.lastUpdateTs,
      );
      const secondsFromQuoteLastUpdate = new BN(depositView.currentUnixTimestamp).sub(
        lpUser.quotePosition.lastUpdateTs,
      );

      const extraOwedBaseInterest = exponentiatedBy(
        new BigNumber(
          lpUser.basePosition.depositedAmount
            .mul(swapInfo.swapConfig.baseAprNumerator)
            .mul(secondsFromBaseLastUpdate)
            .toString(),
        )
          .dividedBy(swapInfo.swapConfig.baseAprDenominator.toString())
          .dividedBy(SECONDS_PER_YEAR),
        DELTAFI_TOKEN_DECIMALS,
      );

      const extraOwnedQuoteInterest = exponentiatedBy(
        new BigNumber(
          lpUser.quotePosition.depositedAmount
            .mul(swapInfo.swapConfig.quoteAprNumerator)
            .mul(secondsFromQuoteLastUpdate)
            .toString(),
        )
          .dividedBy(swapInfo.swapConfig.quoteAprDenominator.toString())
          .dividedBy(new BigNumber(SECONDS_PER_YEAR)),
        DELTAFI_TOKEN_DECIMALS,
      );

      return totalOwedInterest
        .plus(extraOwedBaseInterest)
        .plus(extraOwnedQuoteInterest)
        .toFixed(DELTAFI_TOKEN_DECIMALS);
    }

    return "--";
  }, [lpUser, swapInfo?.swapConfig, depositView.currentUnixTimestamp]);

  const { publicKey: walletPubkey, signTransaction } = useWallet();

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

  const handleClaimInterest = useCallback(async () => {
    if (!walletPubkey || !program || !lpUser) {
      return null;
    }
    const connection = program.provider.connection;

    try {
      dispatch(depositViewActions.setIsProcessing({ isProcessing: true }));

      const transaction = await createClaimFarmRewardsTransaction(
        program,
        connection,
        poolConfig,
        walletPubkey,
        rewardsAccount?.publicKey,
      );
      const signedTransaction = await signTransaction(transaction);

      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");

      dispatch(
        depositViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            action: "claim",
            hash,
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
    }
  }, [lpUser, poolConfig, walletPubkey, program, rewardsAccount, signTransaction, dispatch]);

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

      dispatch(
        depositViewActions.setTokenAmount({
          baseAmount,
          quoteAmount: stringCutTokenDecimals(quoteTokenInfo, quoteAmount),
        }),
      );
    },
    [basePrice, quotePrice, dispatch, swapInfo, quoteTokenInfo],
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
      dispatch(
        depositViewActions.setTokenAmount({
          baseAmount: stringCutTokenDecimals(baseTokenInfo, baseAmount),
          quoteAmount,
        }),
      );
    },
    [basePrice, quotePrice, dispatch, swapInfo, baseTokenInfo],
  );

  const handleWithdrawSlider = useCallback(
    (value: number) => {
      if (lpUser && basePrice && quotePrice) {
        // TODO(ypeng): Consider price and pool ratio
        const baseAmount = anchorBnToBn(baseTokenInfo, lpUser.basePosition.depositedAmount)
          .multipliedBy(value)
          .dividedBy(100);
        const quoteAmount = anchorBnToBn(quoteTokenInfo, lpUser.basePosition.depositedAmount)
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
          <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
            <Box>Transaction failed(try again later)</Box>
            <Box>
              failed to send transaction: Transaction simulation failed: Blockhash not found
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
          {depositView.method === "claim" ? (
            <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
              {`${action.charAt(0).toUpperCase() + action.slice(1)} ${Number(
                unclaimedInterest,
              ).toFixed(DELTAFI_TOKEN_DECIMALS)} DELFI`}
            </Box>
          ) : (
            <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
              {`${action.charAt(0).toUpperCase() + action.slice(1)} ${Number(base.amount).toFixed(
                6,
              )} ${base.token.symbol} and ${Number(quote.amount).toFixed(6)} ${
                quote.token.symbol
              } to ${base.token.symbol}-${quote.token.symbol} pool`}
            </Box>
          )}
          <Box display="flex" alignItems="center">
            <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
              View Transaction:
            </Box>
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
          <CircularProgress color="inherit" />
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
    } else if (depositView.method === "withdraw") {
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
    } else if (depositView.method === "claim") {
      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="contained"
          onClick={handleClaimInterest}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Withdraw, target: Withdraw"
        >
          Claim Interest
        </ConnectButton>
      );
    }

    throw Error("Invalid deposit method: " + depositView.method);
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
    handleClaimInterest,
  ]);

  if (!swapInfo) return null;

  const vertical = "top";
  const horizontal = "right";

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
    <Box width="100%">
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h5">Deposit</Typography>
        <IconButton
          size="small"
          onClick={() => {
            if (isRouterModal) history.push("/pools");
            else setMenu(false, "");
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box className={classes.container}>
        <Box
          display="flex"
          justifyContent="space-between"
          marginTop={3.5}
          marginBottom={4}
          fontSize={16}
          fontWeight={500}
          lineHeight="28px"
        >
          <Box className={classes.iconGroup}>
            <img
              src={baseTokenInfo.logoURI}
              alt={`${baseTokenInfo.symbol} coin`}
              className={classes.coinIcon}
            />
            <img
              src={quoteTokenInfo.logoURI}
              alt={`${quoteTokenInfo.symbol} coin`}
              className={clx(classes.coinIcon, classes.firstCoin)}
            />
          </Box>
          <Box marginLeft={2}>
            <Box>
              {`${reserveDisplay(
                new BigNumber(swapInfo.poolState.baseReserve.toString()),
                baseTokenInfo.decimals,
              )} ${baseTokenInfo.symbol}(${basePercent?.toFormat(2) || "-"}%)`}
            </Box>
            <Box>
              {`${reserveDisplay(
                new BigNumber(swapInfo.poolState.quoteReserve.toString()),
                quoteTokenInfo.decimals,
              )} ${quoteTokenInfo.symbol}(${quotePercent?.toFormat(2) || "-"}%)`}
            </Box>
          </Box>
          <Box marginLeft="auto" textAlign="right">
            <Box sx={{ color: "#D3D3D3", fontSize: 14 }}>Total Share</Box>
            <Box>{convertDollar(userTvl.toFixed(2).toString()) || "-"}</Box>
          </Box>
          <Box marginLeft="auto" textAlign="right">
            <Box sx={{ color: "#D3D3D3", fontSize: 14 }}>Total Reserves</Box>
            <Box>{convertDollar(tvl.toFixed(2).toString()) || "-"}</Box>
          </Box>
        </Box>
        {/* <Box className={classes.statsPanel}>
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
                    {`${reserveDisplay(
                      new BigNumber(swapInfo.poolState.baseReserve.toString()),
                      baseTokenInfo.decimals,
                    )} ${baseTokenInfo.symbol}(${basePercent?.toFormat(2) || "-"}%)`}
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
                      new BigNumber(swapInfo.poolState.quoteReserve.toString()),
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
        </Box> */}
        <Divider />
        <Box className={classes.ratePanel}>
          <Box className={classes.tabs}>
            <Box>
              <MUIButton
                className={method === "deposit" ? classes.activeBtn : classes.btn}
                onClick={() => handleSwitchMethod("deposit")}
              >
                Deposit
              </MUIButton>
              <MUIButton
                className={method === "withdraw" ? classes.activeBtn : classes.btn}
                onClick={() => handleSwitchMethod("withdraw")}
              >
                Withdraw
              </MUIButton>
              <MUIButton
                className={method === "claim" ? classes.activeBtn : classes.btn}
                onClick={() => handleSwitchMethod("claim")}
              >
                Claim Interest
              </MUIButton>
            </Box>
          </Box>
        </Box>
        {(() => {
          switch (method) {
            case "withdraw":
              return (
                <Box display="flex" flexDirection="column" alignItems="flex-end">
                  <WithdrawSelectCard
                    percentage={depositView.withdrawPercentage}
                    onUpdatePercentage={handleWithdrawSlider}
                  />
                  <Box mt={2} />
                  <WithdrawCard
                    card={depositView.base}
                    handleChangeCard={handleBaseTokenInput}
                    withdrawal={baseShare?.toFixed(6).toString()}
                    disableDrop={true}
                  />
                  <Box mt={3} />
                  <WithdrawCard
                    card={depositView.quote}
                    handleChangeCard={handleQuoteTokenInput}
                    withdrawal={quoteShare?.toFixed(6).toString()}
                    disableDrop={true}
                  />
                </Box>
              );
            case "deposit":
              return (
                <Box display="flex" flexDirection="column" alignItems="flex-end" gridGap={24}>
                  <SwapCard
                    card={depositView.base}
                    handleChangeCard={handleBaseTokenInput}
                    disableDrop={true}
                  />
                  <SwapCard
                    card={depositView.quote}
                    handleChangeCard={handleQuoteTokenInput}
                    disableDrop={true}
                  />
                </Box>
              );
            case "claim":
              return (
                <Box display="flex" flexDirection="column" alignItems="flex-end" gridGap={24}>
                  <Paper>Cumulative interest: {cumulativeInterest} DELFI</Paper>
                  <Paper>Unclaimed interest: {unclaimedInterest} DELFI</Paper>
                </Box>
              );
            default:
              throw Error("Invalid deposit card method: " + method);
          }
        })()}
        <Box mt={3} width="100%" sx={{ position: "relative", zIndex: 1 }}>
          {actionButton}
        </Box>
        <Box display="flex" justifyContent="center" className={classes.statsBottom}>
          <Box>{swapFee.toString()}% Swap Fee</Box>
          <Box>{withdrawFee.toString()}% Withdraw Fee</Box>
        </Box>
      </Box>
      {/* <PoolInformation pool={poolConfig} /> */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
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
    </Box>
  );
};

export default Deposit;
