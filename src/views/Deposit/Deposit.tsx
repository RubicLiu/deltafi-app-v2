import React, { useMemo, useCallback, useEffect } from "react";
import {
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
import BigNumber from "bignumber.js";

import { ConnectButton } from "components";

import { useModal } from "providers/modal";
import { exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK } from "constants/index";
import { useHistory } from "react-router-dom";
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
import { partialSignTransaction, sendSignedTransaction } from "utils/transactions";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { fetchSwapsThunk } from "states/accounts/swapAccount";
import { anchorBnToBn, stringCutTokenDecimals, stringToAnchorBn } from "utils/tokenUtils";
import { LiquidityProvider, SwapInfo } from "anchor/type_definitions";
import { scheduleWithInterval } from "utils";
import WithdrawSelectCard from "./components/WithdrawSelectCard/Card";
import DepositCard from "./components/DepositCard/Card";
import { IDepositCard } from "./components/DepositCard/types";
import { calculateWithdrawalFromShares } from "lib/calc";
import BN from "bn.js";
import * as transactionUtils from "anchor/transaction_utils";

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
    marginBottom: spacing(2),
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
      fontSize: 20,
      fontWeight: 500,
      lineHeight: 1,
      fontFamily: "Rubik",
      textTransform: "none",
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
    fontWeight: 400,
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
    return inputAmount.toString();
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

  const lpUser: LiquidityProvider = useSelector(selectLpUserBySwapKey(poolAddress));
  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));
  const depositView = useSelector(depositViewSelector);
  const dispatch = useDispatch();
  const network = deployConfigV2.network;

  // const wrapper = React.createRef();

  useEffect(() => {
    if (baseTokenInfo && quoteTokenInfo) {
      dispatch(depositViewActions.setTokenInfo({ baseTokenInfo, quoteTokenInfo }));
    }
  }, [baseTokenInfo, quoteTokenInfo, dispatch]);

  const basePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.baseShare.toString())
        .plus(new BigNumber(lpUser.baseShare.toString()))
        .dividedBy(new BigNumber(swapInfo.poolState.baseSupply.toString()))
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const quotePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.quoteShare.toString())
        .plus(new BigNumber(lpUser.quoteShare.toString()))
        .dividedBy(new BigNumber(swapInfo.poolState.quoteSupply.toString()))

        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const { availableBaseShares, availableQuoteShares } = useMemo(() => {
    if (!lpUser) {
      return {
        availableBaseShares: null,
        availableQuoteShares: null,
      };
    }
    return {
      availableBaseShares: lpUser.baseShare.sub(lpUser.stakedBaseShare),
      availableQuoteShares: lpUser.quoteShare.sub(lpUser.stakedQuoteShare),
    };
  }, [lpUser]);

  const { maxBaseWithdrawal, maxQuoteWithdrawal } = useMemo(() => {
    const baseTokenConfig = depositView?.base?.token;
    const quoteTokenConfig = depositView?.quote?.token;

    if (
      !availableBaseShares ||
      !availableQuoteShares ||
      !swapInfo?.poolState ||
      !baseTokenConfig ||
      !quoteTokenConfig ||
      !basePrice ||
      !quotePrice
    ) {
      return {
        maxBaseWithdrawal: "--",
        maxQuoteWithdrawal: "--",
      };
    }

    const res = calculateWithdrawalFromShares(
      availableBaseShares,
      availableQuoteShares,
      baseTokenConfig,
      quoteTokenConfig,
      basePrice,
      quotePrice,
      swapInfo.poolState,
    );

    return {
      maxBaseWithdrawal: res.baseWithdrawalAmount,
      maxQuoteWithdrawal: res.quoteWithdrawalAmount,
    };
  }, [availableBaseShares, availableQuoteShares, swapInfo, depositView, basePrice, quotePrice]);

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

  // update reward every 5 seconds
  useEffect(
    () =>
      scheduleWithInterval(() => {
        dispatch(depositViewActions.updateCurrentUnixTimestamp());
      }, 5 * 1000),
    [dispatch],
  );

  const handleWithdrawSlider = useCallback(
    (value: number) => {
      const baseTokenConfig = depositView?.base?.token;
      const quoteTokenConfig = depositView?.quote?.token;
      if (
        availableBaseShares &&
        availableQuoteShares &&
        swapInfo &&
        baseTokenConfig &&
        quoteTokenConfig &&
        basePrice &&
        quotePrice
      ) {
        // TODO(ypeng): Consider price and pool ratio

        const baseInputShare = availableBaseShares.mul(new BN(value)).div(new BN(100));
        const quoteInputShare = availableQuoteShares.mul(new BN(value)).div(new BN(100));
        const { baseWithdrawalAmount, quoteWithdrawalAmount } = calculateWithdrawalFromShares(
          baseInputShare,
          quoteInputShare,
          baseTokenConfig,
          quoteTokenConfig,
          basePrice,
          quotePrice,
          swapInfo?.poolState,
        );

        dispatch(
          depositViewActions.setTokenAmount({
            baseAmount: baseWithdrawalAmount,
            quoteAmount: quoteWithdrawalAmount,
            baseShare: baseInputShare.toString(),
            quoteShare: quoteInputShare.toString(),
          }),
        );
      }
      dispatch(depositViewActions.setWithdrawPercentage({ withdrawPercentage: value }));
    },
    [
      dispatch,
      availableBaseShares,
      availableQuoteShares,
      basePrice,
      quotePrice,
      depositView,
      swapInfo,
    ],
  );

  const { publicKey: walletPubkey, signTransaction } = useWallet();

  const handleDeposit = useCallback(async () => {
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
      const { transaction, signers } = await transactionUtils.createDepositTransaction(
        poolConfig,
        program,
        swapInfo,
        baseTokenAccount.publicKey,
        quoteTokenAccount.publicKey,
        walletPubkey,
        lpUser,
        baseAmount,
        quoteAmount,
        new BN(0),
        new BN(0),
      );

      const signedTransaction = await signTransaction(
        await partialSignTransaction({
          transaction,
          feePayer: walletPubkey,
          signers,
          connection,
        }),
      );

      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");

      dispatch(
        depositViewActions.setTokenAmount({
          baseAmount: "0",
          quoteAmount: "0",
          baseShare: "0",
          quoteShare: "0",
        }),
      );
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
    if (!swapInfo || !walletPubkey || !baseTokenAccount || !quoteTokenAccount || !program) {
      return null;
    }

    const connection = program.provider.connection;
    const base = depositView.base;
    const quote = depositView.quote;
    try {
      if (base.share === "" || quote.share === "") {
        return;
      }
      dispatch(depositViewActions.setIsProcessing({ isProcessing: true }));

      const baseShare = new BN(base.share);
      const quoteShare = new BN(quote.share);

      const { transaction, signers } = await transactionUtils.createWithdrawTransaction(
        poolConfig,
        program,
        swapInfo,
        baseTokenAccount.publicKey,
        quoteTokenAccount.publicKey,
        walletPubkey,
        baseShare,
        quoteShare,
        new BN(0),
        new BN(0),
      );

      const signedTransaction = await signTransaction(
        await partialSignTransaction({
          transaction,
          feePayer: walletPubkey,
          signers,
          connection,
        }),
      );
      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");

      dispatch(
        depositViewActions.setTokenAmount({
          baseAmount: "0",
          quoteAmount: "0",
          baseShare: "0",
          quoteShare: "0",
        }),
      );
      dispatch(depositViewActions.setWithdrawPercentage({ withdrawPercentage: 0 }));

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

  //  const handleClaimInterest = useCallback(async () => {
  //    if (!walletPubkey || !program || !lpUser) {
  //      return null;
  //    }
  //    const connection = program.provider.connection;
  //
  //    try {
  //      dispatch(depositViewActions.setIsProcessing({ isProcessing: true }));
  //
  //      const transaction = await createClaimFarmRewardsTransaction(
  //        program,
  //        connection,
  //        poolConfig,
  //        walletPubkey,
  //        rewardsAccount?.publicKey,
  //      );
  //      const signedTransaction = await signTransaction(transaction);
  //
  //      const hash = await sendSignedTransaction({
  //        signedTransaction,
  //        connection,
  //      });
  //
  //      await connection.confirmTransaction(hash, "confirmed");
  //
  //      dispatch(
  //        depositViewActions.setTransactionResult({
  //          transactionResult: {
  //            status: true,
  //            action: "claim",
  //            hash,
  //          },
  //        }),
  //      );
  //    } catch (e) {
  //      console.error("error", e);
  //      dispatch(
  //        depositViewActions.setTransactionResult({
  //          transactionResult: {
  //            status: false,
  //          },
  //        }),
  //      );
  //    } finally {
  //      dispatch(depositViewActions.setOpenSnackbar({ openSnackbar: true }));
  //      dispatch(depositViewActions.setIsProcessing({ isProcessing: false }));
  //      dispatch(
  //        fetchLiquidityProvidersThunk({
  //          connection,
  //          walletAddress: walletPubkey,
  //        }),
  //      );
  //    }
  //  }, [lpUser, poolConfig, walletPubkey, program, rewardsAccount, signTransaction, dispatch]);

  const handleSnackBarClose = useCallback(() => {
    dispatch(depositViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const handleBaseTokenInput = useCallback(
    (card: IDepositCard) => {
      const baseAmount = card.amount;
      if (baseAmount === "") {
        dispatch(
          depositViewActions.setTokenAmount({
            baseAmount: "0",
            quoteAmount: "0",
            baseShare: "0",
            quoteShare: "0",
          }),
        );
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
          baseShare: "0",
          quoteShare: "0",
        }),
      );
    },
    [basePrice, quotePrice, dispatch, swapInfo, quoteTokenInfo],
  );

  const handleQuoteTokenInput = useCallback(
    (card: IDepositCard) => {
      const quoteAmount = card.amount;
      if (quoteAmount === "") {
        dispatch(
          depositViewActions.setTokenAmount({
            baseAmount: "0",
            quoteAmount: "0",
            baseShare: "0",
            quoteShare: "0",
          }),
        );
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
          baseShare: "0",
          quoteShare: "0",
        }),
      );
    },
    [basePrice, quotePrice, dispatch, swapInfo, baseTokenInfo],
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
          {
            <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
              {`${action.charAt(0).toUpperCase() + action.slice(1)} ${Number(base.amount).toFixed(
                6,
              )} ${base.token.symbol} and ${Number(quote.amount).toFixed(6)} ${quote.token.symbol}`}
            </Box>
          }
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
        <>
          <Box height={16}></Box>
          <ConnectButton fullWidth onClick={() => setMenu(true, "connect")}>
            <Box fontSize={20} lineHeight="36px">
              Connect Wallet
            </Box>
          </ConnectButton>
        </>
      );
    }

    if (depositView.isProcessing) {
      return (
        <>
          <Box height={16}></Box>
          <ConnectButton fullWidth variant="contained" disabled={true}>
            <CircularProgress size={36} color="inherit" />
          </ConnectButton>
        </>
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
            <>
              <Box
                marginLeft="auto"
                marginRight="auto"
                marginTop={2}
                marginBottom={2}
                color="#F60505"
                textAlign="center"
              >
                Insufficient balance
              </Box>
              <ConnectButton fullWidth disabled>
                <Box fontSize={20} lineHeight="36px">
                  Deposit
                </Box>
              </ConnectButton>
            </>
          );
        }
      }
      return (
        <>
          <Box height={16}></Box>
          <ConnectButton
            fullWidth
            variant="contained"
            onClick={handleDeposit}
            data-amp-analytics-on="click"
            data-amp-analytics-name="click"
            data-amp-analytics-attrs="page: Deposit, target: Deposit"
          >
            <Box fontSize={20} lineHeight="36px">
              Deposit
            </Box>
          </ConnectButton>
        </>
      );
    } else if (depositView.method === "withdraw") {
      if (base && quote && baseShare && quoteShare) {
        if (
          baseShare.isLessThan(new BigNumber(base.amount)) ||
          quoteShare.isLessThan(new BigNumber(quote.amount))
        ) {
          return (
            <>
              <Box
                marginLeft="auto"
                marginRight="auto"
                marginTop={2}
                marginBottom={2}
                color="#F60505"
                textAlign="center"
              >
                Insufficient balance
              </Box>
              <ConnectButton fullWidth disabled>
                <Box fontSize={20} lineHeight="36px">
                  Withdraw
                </Box>
              </ConnectButton>
            </>
          );
        }
      }
      return (
        <>
          <Box height={16}></Box>
          <ConnectButton
            fullWidth
            variant="contained"
            onClick={handleWithdraw}
            data-amp-analytics-on="click"
            data-amp-analytics-name="click"
            data-amp-analytics-attrs="page: Withdraw, target: Withdraw"
          >
            <Box fontSize={20} lineHeight="36px">
              Withdraw
            </Box>
          </ConnectButton>
        </>
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
  ]);

  if (!swapInfo) return null;

  const vertical = "top";
  const horizontal = "right";

  const method = depositView.method;

  return (
    <Box width="100%">
      <Box className={classes.container}>
        <Box className={classes.ratePanel}>
          <Box className={classes.tabs} position="relative">
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
              {/* <MUIButton
                className={method === "claim" ? classes.activeBtn : classes.btn}
                onClick={() => handleSwitchMethod("claim")}
              >
                Claim Interest
              </MUIButton> */}
            </Box>
            <Box position="absolute" right={0}>
              <IconButton
                onClick={() => {
                  if (isRouterModal) history.push("/pools");
                  else setMenu(false, "");
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <Divider />
        </Box>
        <Box mt={2}>
          {(() => {
            switch (method) {
              case "withdraw":
                return (
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gridGap={4}>
                    <WithdrawSelectCard
                      percentage={depositView.withdrawPercentage}
                      onUpdatePercentage={handleWithdrawSlider}
                    />
                    <DepositCard
                      card={depositView.base}
                      withdrawal={maxBaseWithdrawal}
                      isDeposit={depositView.method === "deposit"}
                      disableDrop={true}
                    />
                    <DepositCard
                      card={depositView.quote}
                      withdrawal={maxQuoteWithdrawal}
                      isDeposit={depositView.method === "deposit"}
                      disableDrop={true}
                    />
                  </Box>
                );
              case "deposit":
                return (
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gridGap={4}>
                    <DepositCard
                      card={depositView.base}
                      handleChangeCard={handleBaseTokenInput}
                      isDeposit={depositView.method === "deposit"}
                      disableDrop={true}
                    />
                    <DepositCard
                      card={depositView.quote}
                      handleChangeCard={handleQuoteTokenInput}
                      isDeposit={depositView.method === "deposit"}
                      disableDrop={true}
                    />
                  </Box>
                );
              default:
                throw Error("Invalid deposit card method: " + method);
            }
          })()}
        </Box>
        <Box width="100%" sx={{ position: "relative", zIndex: 1 }}>
          {actionButton}
        </Box>
        <Box display="flex" justifyContent="center" className={classes.statsBottom}>
          <Box>{swapFee.toString()}% Swap Fee</Box>
          <Box>{withdrawFee.toString()}% Withdraw Fee</Box>
        </Box>
      </Box>
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
