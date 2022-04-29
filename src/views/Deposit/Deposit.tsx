import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import { useCustomConnection } from "providers/connection";
import { PoolInformation } from "./PoolInformation";
import loadingIcon from "components/gif/loading_white.gif";
import { useSelector } from "react-redux";
import { getPoolConfigBySwapKey, getTokenConfigBySymbol } from "constants/deployConfigV2";
import {
  selectLpUserBySwapKey,
  selectMarketPriceByPool,
  selectSwapBySwapKey,
  selectTokenAccountInfoByMint,
} from "states/v2/selectorsV2";

interface TransactionResult {
  status: boolean | null;
  action?: "deposit" | "withdraw";
  hash?: string;
  base?: ISwapCard;
  quote?: ISwapCard;
}

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

const Deposit: React.FC = () => {
  const classes = useStyles();
  const { connected: isConnectedWallet } = useWallet();
  const { setMenu } = useModal();
  const [withdrawPercentage, setWithdrawPercentage] = useState(0);
  const [state, setState] = useState<{
    open: boolean;
    vertical: "bottom" | "top";
    horizontal: "left" | "center" | "right";
  }>({
    open: false,
    vertical: "bottom",
    horizontal: "left",
  });
  const { poolAddress } = useParams<{ poolAddress: string }>();
  const [method, switchMethod] = useState<string>("deposit");
  const swapInfo = useSelector(selectSwapBySwapKey(poolAddress));

  const [base, setBase] = useState<ISwapCard>({ token: null, amount: "", amountWithSlippage: "" });
  const [quote, setQuote] = useState<ISwapCard>({
    token: null,
    amount: "",
    amountWithSlippage: "",
  });

  const poolConfig = getPoolConfigBySwapKey(poolAddress);

  const baseTokenInfo = getTokenConfigBySymbol(poolConfig.base);
  const quoteTokenInfo = getTokenConfigBySymbol(poolConfig.quote);
  const baseTokenAccount = useSelector(selectTokenAccountInfoByMint(baseTokenInfo.mint));
  const quoteTokenAccount = useSelector(selectTokenAccountInfoByMint(quoteTokenInfo.mint));

  const lpUser = useSelector(selectLpUserBySwapKey(poolAddress));

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const [transactionResult] = useState<TransactionResult>({
    status: null,
  });
  const [isProcessing] = useState(false);
  const { network } = useCustomConnection();

  useEffect(() => {
    if (baseTokenInfo && quoteTokenInfo) {
      setBase((base) => ({ ...base, token: baseTokenInfo }));
      setQuote((quote) => ({ ...quote, token: quoteTokenInfo }));
    }
  }, [baseTokenInfo, quoteTokenInfo]);

  const baseTvl = useMemo(() => {
    if (basePrice && swapInfo) {
      return getTokenTvl(
        swapInfo.poolState.baseReserve.toNumber(),
        baseTokenInfo.decimals,
        basePrice,
      );
    }
    return new BigNumber(0);
  }, [basePrice, swapInfo, baseTokenInfo]);

  const quoteTvl = useMemo(() => {
    if (quotePrice && swapInfo) {
      return getTokenTvl(
        swapInfo.poolState.quoteReserve.toNumber(),
        quoteTokenInfo.decimals,
        quotePrice,
      );
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
        .dividedBy(new BigNumber(swapInfo.baseSupply))
        .multipliedBy(100);
    }
    return new BigNumber(0);
  }, [lpUser, swapInfo]);

  const quotePercent = useMemo(() => {
    if (lpUser && swapInfo) {
      return new BigNumber(lpUser.quoteShare)
        .plus(new BigNumber(lpUser.quotePosition.depositedAmount))
        .dividedBy(new BigNumber(swapInfo.quoteSupply))
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
      return new BigNumber(swapInfo.poolState.baseReserve).multipliedBy(basePercent).dividedBy(100);
    }
    return new BigNumber(0);
  }, [swapInfo, basePercent]);

  const quoteShare = useMemo(() => {
    if (swapInfo && quotePercent) {
      return new BigNumber(swapInfo.poolState.quoteReserve)
        .multipliedBy(quotePercent)
        .dividedBy(100);
    }
    return new BigNumber(0);
  }, [swapInfo, quotePercent]);

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

  const handleDeposit = useCallback(
    async () => {
      // TODO(ypeng): Add implementation for v2.
      //    let transaction: Transaction;
      //
      //    if (!connection || !pool || !walletPubkey || !baseTokenAccount || !quoteTokenAccount) {
      //      return null;
      //    }
      //
      //    setIsProcessing(true);
      //    try {
      //      if (base.amount !== "" && quote.amount !== "") {
      //        const depositMethod = pool.swapType === SwapType.Normal ? deposit : stableDeposit;
      //        transaction = await depositMethod({
      //          connection,
      //          walletPubkey,
      //          pool,
      //          baseAccount: baseTokenAccount,
      //          quoteAccount: quoteTokenAccount,
      //          poolTokenRef: null,
      //          depositData: {
      //            amountTokenA: BigInt(
      //              exponentiate(base.amount, pool.baseTokenInfo.decimals).integerValue().toString(),
      //            ),
      //            amountTokenB: BigInt(
      //              exponentiate(quote.amount, pool.quoteTokenInfo.decimals).integerValue().toString(),
      //            ),
      //            amountMintMin: BigInt(0),
      //          },
      //          config,
      //          farmPool: farmPoolKey,
      //          farmUser: farmUser?.publicKey,
      //        });
      //      } else {
      //        setIsProcessing(false);
      //        return null;
      //      }
      //
      //      transaction = await signTransaction(transaction);
      //
      //      const hash = await sendSignedTransaction({
      //        signedTransaction: transaction,
      //        connection,
      //      });
      //
      //      await connection.confirmTransaction(hash, "confirmed");
      //
      //      await fecthTokenAccountInfoList(
      //        [base.token.mint, quote.token.mint, pool.poolMintKey.toBase58()],
      //        walletPubkey,
      //        connection,
      //        dispatch,
      //      );
      //
      //      setBase((prevBase) => ({ ...prevBase, amount: "" }));
      //      setQuote((prevQuote) => ({ ...prevQuote, amount: "" }));
      //      setTransactionResult({
      //        status: true,
      //        action: "deposit",
      //        hash,
      //        base,
      //        quote,
      //      });
      //    } catch (e) {
      //      console.error("error", e);
      //      setBase((prevBase) => ({ ...prevBase, amount: "" }));
      //      setQuote((prevQuote) => ({ ...prevQuote, amount: "" }));
      //      setTransactionResult({ status: false });
      //    } finally {
      //      setState((state) => ({ ...state, open: true }));
      //      setIsProcessing(false);
      //      dispatch(
      //        fetchFarmUsersThunk({
      //          connection,
      //          walletAddress: walletPubkey,
      //        }),
      //      );
      //      dispatch(fetchPoolsThunk({ connection }));
      //    }
    },
    [
      //    connection,
      //    pool,
      //    walletPubkey,
      //    baseTokenAccount,
      //    quoteTokenAccount,
      //    base,
      //    quote,
      //    signTransaction,
      //    config,
      //    farmPoolKey,
      //    farmUser,
      //    dispatch,
    ],
  );

  const handleWithdraw = useCallback(
    async () => {
      // TODO(ypeng): Add implementation for v2.
      //    let transaction: Transaction;
      //
      //    if (!connection || !pool || !walletPubkey) {
      //      return null;
      //    }
      //
      //    setIsProcessing(true);
      //    try {
      //      if (base.amount !== "" && quote.amount !== "") {
      //        const withdrawMethod = pool.swapType === SwapType.Normal ? withdraw : stableWithdraw;
      //        transaction = await withdrawMethod({
      //          connection,
      //          walletPubkey,
      //          poolTokenAccount: null,
      //          pool,
      //          baseTokenRef: baseTokenAccount?.publicKey,
      //          quteTokenRef: quoteTokenAccount?.publicKey,
      //          withdrawData: {
      //            amountPoolToken: BigInt(
      //              pmm
      //                .poolTokenFromAmount(
      //                  exponentiate(base.amount, pool.baseTokenInfo.decimals),
      //                  exponentiate(quote.amount, pool.quoteTokenInfo.decimals),
      //                  new BigNumber(0),
      //                  share,
      //                )
      //                // round ceil makes sure the amount of token the lp token
      //                // worth is more than the min amount using round floor below
      //                // the poolTokenFromAmount guarantees the lp token amout after round ceil
      //                // won't be more than the amount the user actually has
      //                .integerValue(BigNumber.ROUND_CEIL)
      //                .toNumber()
      //                .toString(),
      //            ),
      //            minAmountTokenA: BigInt(
      //              exponentiate(base.amount, pool.baseTokenInfo.decimals)
      //                .integerValue(BigNumber.ROUND_FLOOR)
      //                .toString(),
      //            ),
      //            minAmountTokenB: BigInt(
      //              exponentiate(quote.amount, pool.quoteTokenInfo.decimals)
      //                .integerValue(BigNumber.ROUND_FLOOR)
      //                .toString(),
      //            ),
      //          },
      //        });
      //      } else {
      //        setIsProcessing(false);
      //        return null;
      //      }
      //
      //      transaction = await signTransaction(transaction);
      //      const hash = await sendSignedTransaction({
      //        signedTransaction: transaction,
      //        connection,
      //      });
      //
      //      await connection.confirmTransaction(hash, "confirmed");
      //
      //      await fecthTokenAccountInfoList(
      //        [base.token.mint, quote.token.mint, pool.poolMintKey.toBase58()],
      //        walletPubkey,
      //        connection,
      //        dispatch,
      //      );
      //
      //      setBase((prevBase) => ({ ...prevBase, amount: "" }));
      //      setQuote((prevQuote) => ({ ...prevQuote, amount: "" }));
      //      setWithdrawPercentage(0);
      //      setTransactionResult({
      //        status: true,
      //        action: "withdraw",
      //        hash,
      //        base,
      //        quote,
      //      });
      //    } catch (e) {
      //      console.error("error", e);
      //      setBase((prevBase) => ({ ...prevBase, amount: "", lastUpdate: Date.now() }));
      //      setQuote((prevQuote) => ({ ...prevQuote, amount: "", lastUpdate: Date.now() }));
      //      setTransactionResult({ status: false });
      //    } finally {
      //      setState({ ...state, open: true });
      //      setIsProcessing(false);
      //      dispatch(
      //        fetchFarmUsersThunk({
      //          connection,
      //          walletAddress: walletPubkey,
      //        }),
      //      );
      //      dispatch(fetchPoolsThunk({ connection }));
      //    }
    },
    [
      //    connection,
      //    pool,
      //    walletPubkey,
      //    state,
      //    base,
      //    quote,
      //    signTransaction,
      //    baseTokenAccount?.publicKey,
      //    quoteTokenAccount?.publicKey,
      //    dispatch,
      //    pmm,
      //    share,
    ],
  );

  const handleSnackBarClose = useCallback(() => {
    setState((state) => ({ ...state, open: false }));
  }, []);

  const handleTokenFromInput = useCallback(
    (card: ISwapCard) => {
      // TODO(ypeng): Add implementation for v2.
      //      setBase(card);
      //      if (!quote.token) return;
      //
      //      if (pool) {
      //        if (method === "deposit") {
      //          const outAmount = getOutAmount(pool, card.amount, card.token.mint, quote.token.mint, 0.0);
      //          setQuote({
      //            ...quote,
      //            amount: isNaN(outAmount) ? "" : Number(outAmount).toString(),
      //          });
      //        } else {
      //          if (share && card.amount) {
      //            setWithdrawPercentage(
      //              pmm
      //                .baseShareRate(exponentiate(card.amount, card.token.decimals).toNumber(), share)
      //                .toNumber() * 100,
      //            );
      //            setQuote({
      //              ...quote,
      //              amount: pmm.quoteFromBase(parseFloat(card.amount)).toString(),
      //            });
      //          } else if (card.amount === "") {
      //            setWithdrawPercentage(0);
      //            setQuote({ ...quote, amount: "" });
      //          }
      //        }
      //      }
    },
    [
      //pool, pmm, share, method, quote
    ],
  );

  const handleTokenToInput = useCallback(
    (card: ISwapCard) => {
      // TODO(ypeng): Add implementation for v2.
      //      setQuote(card);
      //      if (!base.token) return;
      //
      //      if (pool) {
      //        if (method === "deposit") {
      //          const outAmount = getOutAmount(pool, card.amount, card.token.mint, base.token.mint, 0.0);
      //          setBase({
      //            ...base,
      //            amount: isNaN(outAmount) ? "" : Number(outAmount).toString(),
      //          });
      //        } else {
      //          if (share && card.amount) {
      //            setWithdrawPercentage(
      //              pmm
      //                .quoteShareRate(exponentiate(card.amount, card.token.decimals).toNumber(), share)
      //                .toNumber() * 100,
      //            );
      //            setBase({ ...base, amount: pmm.baseFromQuote(parseFloat(card.amount)).toString() });
      //          } else if (card.amount === "") {
      //            setWithdrawPercentage(0);
      //            setBase({ ...base, amount: "" });
      //          }
      //        }
      //      }
    },
    [
      //pool, pmm, share, method, base
    ],
  );

  const handleWithdrawSlider = useCallback(
    (value: number) => {
      // TODO(ypeng): Add implementation for v2.
      //      if (pmm && share) {
      //        const [baseAmount, quoteAmount] = pmm.amountFromShare(
      //          (share.toNumber() * value) / 100,
      //          pool.baseTokenInfo.decimals,
      //          pool.quoteTokenInfo.decimals,
      //        );
      //        setBase({ ...base, amount: baseAmount.toString() });
      //        setQuote({ ...quote, amount: quoteAmount.toString() });
      //      }
      //      setWithdrawPercentage(value);
    },
    [
      //pmm, share, base, quote, pool
    ],
  );

  const handleSwitchMethod = (method: string) => {
    switchMethod(method);
    setBase({ ...base, amount: "" });
    setQuote({ ...quote, amount: "" });
    setWithdrawPercentage(0);
  };

  const snackMessasge = useMemo(() => {
    if (!transactionResult.status) {
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

    const { base, quote, hash, action } = transactionResult;

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
            } for ${base.token.symbol}-${quote.token.symbol} LP`}
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
  }, [transactionResult, classes, network]);

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

    if (isProcessing) {
      return (
        <ConnectButton size="large" fullWidth variant="contained" disabled={true}>
          <Avatar className={classes.actionLoadingButton} src={loadingIcon} />
        </ConnectButton>
      );
    }
    if (method === "deposit") {
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
      //      if (base && quote && baseShare && quoteShare) {
      //        if (
      //          baseShare.isLessThan(new BigNumber(base.amount)) ||
      //          quoteShare.isLessThan(new BigNumber(quote.amount))
      //        ) {
      //          return (
      //            <ConnectButton size="large" fullWidth disabled>
      //              Insufficient balance
      //            </ConnectButton>
      //          );
      //        }
      //      }
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
    isProcessing,
    isConnectedWallet,
    baseTokenAccount,
    base,
    //baseShare,
    quoteTokenAccount,
    quote,
    //quoteShare,
    setMenu,
    handleDeposit,
    handleWithdraw,
    method,
    classes.actionLoadingButton,
  ]);

  if (!swapInfo) return null;

  const { open, vertical, horizontal } = state;

  const reserveDisplay = (reserve: BigNumber, decimals: number): string => {
    if (!reserve || !decimals) {
      return "0.00";
    }

    const displayThreshold = 1;
    const value = exponentiatedBy(reserve, decimals);
    if (value.toNumber() < displayThreshold) {
      return value.toFormat(decimals);
    }
    return value.toFormat(2);
  };

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
                percentage={withdrawPercentage}
                onUpdatePercentage={handleWithdrawSlider}
              />
              <WithdrawCard
                card={base}
                handleChangeCard={handleTokenFromInput}
                withdrawal={baseShare?.toFixed(6).toString()}
                disableDrop={true}
              />
              <Box mt={1} />
              <WithdrawCard
                card={quote}
                handleChangeCard={handleTokenToInput}
                withdrawal={quoteShare?.toFixed(6).toString()}
                disableDrop={true}
              />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <SwapCard card={base} handleChangeCard={handleTokenFromInput} disableDrop={true} />
              <Box mt={1} />
              <SwapCard card={quote} handleChangeCard={handleTokenToInput} disableDrop={true} />
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
        open={open}
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
