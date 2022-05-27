import React, { useCallback, useMemo, useState } from "react";
import {
  Typography,
  IconButton,
  makeStyles,
  Theme,
  Paper,
  Container,
  Box,
  Fab,
  Snackbar,
  SnackbarContent,
  Link,
  Avatar,
} from "@material-ui/core";
import { useWallet } from "@solana/wallet-adapter-react";
import SyncAlt from "@material-ui/icons/SyncAlt";
import CloseIcon from "@material-ui/icons/Close";

import Page from "components/layout/Page";
import { ConnectButton } from "components";
import SettingsPanel from "components/SettingsPanel/SettingsPanel";
import SwapCard from "./components/Card";
import { useModal } from "providers/modal";
import { exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK } from "constants/index";
import { SWAP_DIRECTION } from "lib/instructions";
import { sendSignedTransaction } from "utils/transactions";
import { SwapCard as ISwapCard } from "./components/types";
import loadingIcon from "components/gif/loading_white.gif";
import { PublicKey } from "@solana/web3.js";
import { useSelector, useDispatch } from "react-redux";
import {
  appSelector,
  selectPoolBySymbols,
  selectMarketPriceByPool,
  selectTokenAccountInfoByMint,
  selectSwapBySwapKey,
  programSelector,
  deltafiUserSelector,
  swapViewSelector,
} from "states/selectors";
import {
  deployConfigV2,
  enableReferral,
  getPoolConfigBySymbols,
  getTokenConfigBySymbol,
  poolConfigs,
  tokenConfigs,
} from "constants/deployConfigV2";
import { getTokenBalanceDiffFromTransaction } from "utils/transactions/utils";
import { swapViewActions } from "states/views/swapView";
import { createSwapTransaction } from "utils/transactions/swap";
import { anchorBnToString, stringToAnchorBn } from "utils/tokenUtils";
import { fecthTokenAccountInfoList } from "states/accounts/tokenAccount";
import BN from "bn.js";
import { fetchDeltafiUserThunk } from "states/accounts/deltafiUserAccount";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    maxWidth: 550,
    margin: "0 auto",
    flex: 1,
    marginTop: "56px",
  },
  root: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    marginBottom: spacing(2),
    [breakpoints.up("sm")]: {
      padding: `${spacing(5)}px ${spacing(4)}px`,
      borderRadius: spacing(3),
      marginBottom: spacing(4),
    },
    position: "relative",
  },
  swapIcon: {
    transform: "rotate(90deg)",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: -16,
    marginBottom: -16,
    backgroundColor: palette.background.secondary,
    border: `3px solid ${palette.background.primary}`,
    boxShadow: "none",
  },
  ratePanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(2.5),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(3.5),
    },
  },
  marketCondition: {
    fontWeight: 400,
  },
  snackBarContent: {
    maxWidth: 421,
    backgroundColor: palette.background.lightBlack,
    display: "flex",
    flexWrap: "unset",
    alignItems: "center",
  },
  snackBarLink: {
    color: palette.text.blue,
    cursor: "pointer",
    textDecoration: "none !important",
    marginLeft: spacing(1),
  },
  snackBarClose: {
    marginTop: 5,
  },
  snackBarIcon: {
    marginRight: spacing(2),
  },
  actionLoadingButton: {
    width: 50,
    height: 50,
    marginTop: 4,
    marginBottom: 4,
  },
  textField: {
    width: "100%",
    height: "60px",
    borderRadius: "100px",
    border: "1px solid #d4ff00",
    background: palette.background.primary,
    display: "flex",
    justifyContent: "center",
    "& .MuiInput-underline:before": {
      content: "",
      border: 0,
    },
    "& .MuiInput-underline:after": {
      content: "",
      border: 0,
    },
    "& .MuiInput-underline:hover:before": {
      content: "",
      border: 0,
    },
    "& .MuiInput-underline:hover:after": {
      content: "",
      border: 0,
    },
    "& div.MuiInputBase-fullWidth": {
      padding: "20px 24px",
      width: "calc(100%)",
    },
  },
  optionsPaper: {
    borderRadius: "20px",
    border: "1px solid #D4FF00",
    paddingTop: "18px",
    paddingBottom: "24px",
    "& ul::before": {
      content: "'Top Traded Pairs'",
      display: "block",
      fontSize: "20px",
      fontWeight: "500",
      lineHeight: "24px",
      marginLeft: "48px",
      marginBottom: "12px",
    },
  },
  icon: {
    width: spacing(2.5),
    height: spacing(2.5),
    [breakpoints.up("sm")]: {
      width: spacing(4),
      height: spacing(4),
    },
  },
  tradePairTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  tradePairName: {
    fontSize: 12,
    fontWeight: 400,
  },
  maxSlippageBtn: {
    height: 30,
    borderRadius: 50,
    "& span": {
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 14,
    },
    padding: "1px !important",
  },
  currency: {
    background: palette.background.tertiary,
    borderRadius: 20,
    padding: "24px 24px",
    marginTop: 24,
    fontSize: 12,
    lineHeight: "24px",
    color: palette.text.dark,
  },
}));

function getPossibleTokenToConfigs(tokenFrom: ISwapCard) {
  const possibleTokenToConfigs = [];
  for (const poolConfig of poolConfigs) {
    const { base, quote } = poolConfig;
    if (base === tokenFrom.token.symbol) {
      possibleTokenToConfigs.push(getTokenConfigBySymbol(quote));
    }
    if (quote === tokenFrom.token.symbol) {
      possibleTokenToConfigs.push(getTokenConfigBySymbol(base));
    }
  }
  return possibleTokenToConfigs;
}

const Home: React.FC = (props) => {
  const dispatch = useDispatch();

  const classes = useStyles(props);
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = useWallet();
  const [tokenFrom, setTokenFrom] = useState<ISwapCard>({
    token: getTokenConfigBySymbol("SOL"),
    amount: "",
    amountWithSlippage: "",
  });
  const [tokenTo, setTokenTo] = useState<ISwapCard>({
    token: getTokenConfigBySymbol("USDC"),
    amount: "",
    amountWithSlippage: "",
  });
  const deltafiUser = useSelector(deltafiUserSelector).user;
  const poolConfig = getPoolConfigBySymbols(tokenFrom.token.symbol, tokenTo.token.symbol);
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const pool = useSelector(selectPoolBySymbols(tokenFrom.token.symbol, tokenTo.token.symbol));

  const sourceAccount = useSelector(selectTokenAccountInfoByMint(tokenFrom.token.mint));
  const destinationAccount = useSelector(selectTokenAccountInfoByMint(tokenTo.token.mint));

  const sourceBalance = useMemo(() => {
    if (sourceAccount && tokenFrom) {
      return exponentiatedBy(sourceAccount.amount, tokenFrom.token.decimals);
    }
    return null;
  }, [sourceAccount, tokenFrom]);

  const [maxSlippage, setMaxSlippage] = useState("2.0");
  const [openSettings, setOpenSettings] = useState(false);
  const { setMenu } = useModal();
  const app = useSelector(appSelector);

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(pool));

  const exchangeRateLabel = useMemo(() => {
    if (basePrice && quotePrice && pool) {
      if (tokenFrom.token.symbol === pool?.baseTokenInfo.symbol) {
        return Number(basePrice / quotePrice).toFixed(pool.quoteTokenInfo.decimals);
      } else if (tokenFrom.token.symbol === pool?.quoteTokenInfo.symbol) {
        return Number(quotePrice / basePrice).toFixed(pool.baseTokenInfo.decimals);
      }
    }
    return "-";
  }, [basePrice, quotePrice, tokenFrom.token.symbol, pool]);
  const [state, setState] = useState<{
    open: boolean;
    vertical: "bottom" | "top";
    horizontal: "left" | "center" | "right";
  }>({
    open: false,
    vertical: "top",
    horizontal: "right",
  });
  const program = useSelector(programSelector);

  const possibleTokenToConfigs = useMemo(() => getPossibleTokenToConfigs(tokenFrom), [tokenFrom]);

  const handleSwapDirectionChange = () => {
    const temp = Object.assign({}, tokenFrom);
    setTokenFrom(tokenTo);
    setTokenTo(temp);
  };

  const handleChangeMaxSlippage = (value) => {
    setMaxSlippage(value);
  };

  const handleOpenSettings = () => {
    setOpenSettings(!openSettings);
  };

  const handleSnackBarClose = useCallback(() => {
    setState((_state) => ({ ..._state, open: false }));
  }, []);

  const handleTokenFromInput = (card: ISwapCard) => {
    // let newTokenFrom = card.token;
    // let newTokenTo = tokenTo.token;
    // let amountOut = "";
    // let amountOutWithSlippage = "";
    // if (tokenTo.token.mint === newTokenFrom.mint) {
    //   newTokenTo = Object.assign({}, tokenFrom.token);
    // }
    // if (pool && priceImpact) {
    //   const { amountOut: quoteAmount, amountOutWithSlippage: quoteAmountWithSlippage } =
    //     getSwapOutAmount(
    //       pool,
    //       newTokenFrom.mint,
    //       newTokenTo.mint,
    //       card.amount ?? "0",
    //       parseFloat(priceImpact),
    //       marketPrice,
    //     );
    //   amountOut = isNaN(quoteAmount) ? "" : Number(quoteAmount).toString();
    //   amountOutWithSlippage = isNaN(quoteAmountWithSlippage)
    //     ? ""
    //     : Number(quoteAmountWithSlippage).toString();
    // }
    // setTokenFrom({ ...tokenFrom, token: newTokenFrom, amount: card.amount });
    // setTokenTo({ token: newTokenTo, amount: amountOut, amountWithSlippage: amountOutWithSlippage });
  };

  const handleTokenToInput = (card: ISwapCard) => {
    // let newTokenFrom = tokenFrom.token;
    // let newTokenTo = card.token;
    // let amountOut = "";
    // let amountOutWithSlippage = "";
    // if (tokenFrom.token.mint === newTokenTo.mint) {
    //   newTokenFrom = Object.assign({}, tokenTo.token);
    // }
    // if (pool && priceImpact) {
    //   const { amountOut: quoteAmount, amountOutWithSlippage: quoteAmountWithSlippage } =
    //     getSwapOutAmount(
    //       pool,
    //       newTokenFrom.mint,
    //       newTokenTo.mint,
    //       tokenFrom.amount ?? "0",
    //       parseFloat(priceImpact),
    //       marketPrice,
    //     );
    //   amountOut = isNaN(quoteAmount) ? "" : Number(quoteAmount).toString();
    //   amountOutWithSlippage = isNaN(quoteAmountWithSlippage)
    //     ? ""
    //     : Number(quoteAmountWithSlippage).toString();
    // }
    // setTokenFrom({ ...tokenFrom, token: newTokenFrom });
    // setTokenTo({ token: newTokenTo, amount: amountOut, amountWithSlippage: amountOutWithSlippage });
  };
  const swapView = useSelector(swapViewSelector);

  const swapCallback = useCallback(async () => {
    if (!swapInfo || !sourceAccount || !walletPubkey || !program) {
      return null;
    }

    if (sourceBalance.isLessThan(tokenFrom.amount)) {
      return null;
    }

    const connection = program.provider.connection;
    dispatch(swapViewActions.setIsProcessing({ isProcessing: true }));
    try {
      const referrer = enableReferral ? deltafiUser?.referrer : app.referrer;

      const amountIn = stringToAnchorBn(tokenFrom.token, tokenFrom.amount);
      const minimumAmountOut = stringToAnchorBn(tokenTo.token, tokenTo.amountWithSlippage);
      const swapDirection =
        tokenFrom.token.mint === swapInfo.mintBase.toBase58()
          ? SWAP_DIRECTION.SellBase
          : SWAP_DIRECTION.SellQuote;

      let { transaction, createAccountsCost, userDestinationTokenRef } =
        await createSwapTransaction(
          program,
          connection,
          poolConfig,
          swapInfo,
          sourceAccount?.publicKey,
          destinationAccount?.publicKey,
          walletPubkey,
          deltafiUser,
          referrer,
          swapDirection,
          amountIn,
          minimumAmountOut,
        );

      transaction = await signTransaction(transaction);
      const signature = await sendSignedTransaction({ signedTransaction: transaction, connection });
      await connection.confirmTransaction(signature, "confirmed");
      // fetch account info and update record for from and to tokens
      // this process does not have to blocking because we no longer need its result anymore
      fecthTokenAccountInfoList(
        [tokenFrom.token.mint, tokenTo.token.mint],
        walletPubkey,
        connection,
        dispatch,
        "confirmed",
      )
        // in most case, getting account info with confirmed commitment
        // will update the balance correctly
        // but it does not guarantee the result is correct
        // we need to further wait for the transaction to finalize and then
        // fetch the finalized balance
        .then(() => connection.confirmTransaction(signature, "finalized"))
        .then(() =>
          fecthTokenAccountInfoList(
            [tokenFrom.token.mint, tokenTo.token.mint],
            walletPubkey,
            connection,
            dispatch,
            "finalized",
          ),
        );

      dispatch(swapViewActions.setTokenFrom({ ...swapView.tokenFrom, amount: "" }));
      dispatch(swapViewActions.setTokenTo({ ...swapView.tokenTo, amount: "" }));

      // get the actual difference of source and base token account from the transaction record
      const { fromTokenBalanceDiff, toTokenBalanceDiff } = await getTokenBalanceDiffFromTransaction(
        connection,
        signature,
        sourceAccount,
        destinationAccount
          ? destinationAccount
          : {
              publicKey: userDestinationTokenRef,
              amount: undefined,
              mint: new PublicKey(tokenTo.token.mint),
            },
      );

      // when calculating how much solana is actually swapped
      // we need to ignore the transaction fee and cost for creating new token/referral accounts

      // get transaction fee function of this transaction
      const getTransactionFee = async () =>
        (await connection.getFeeForMessage(transaction.compileMessage(), "confirmed")).value;

      // get total "process fee" that should be ignored in the token balance difference
      // if the token is not SOL, this value is always 0 because we only have transaction fee
      // and account creation cost in SOL
      let fromProcessFee = 0;
      let toProcessFee = 0;
      if (tokenFrom.token.symbol === "SOL") {
        fromProcessFee = (await getTransactionFee()) + createAccountsCost;
      } else if (tokenTo.token.symbol === "SOL") {
        toProcessFee = (await getTransactionFee()) + createAccountsCost;
      }

      const actualAmountFrom = anchorBnToString(
        tokenFrom.token,
        new BN(-fromTokenBalanceDiff - fromProcessFee),
      );
      const actualAmountTo = anchorBnToString(
        tokenTo.token,
        new BN(toTokenBalanceDiff + toProcessFee),
      );

      dispatch(
        swapViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            signature,
            base: {
              ...tokenFrom,
              amount: actualAmountFrom,
            },
            quote: {
              ...tokenTo,
              amount: actualAmountTo,
            },
          },
        }),
      );
      dispatch(fetchDeltafiUserThunk({ connection, walletAddress: walletPubkey }));
    } catch (e) {
      console.error(e);
      dispatch(swapViewActions.setTransactionResult({ transactionResult: { status: false } }));
    } finally {
      dispatch(swapViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(swapViewActions.setIsProcessing({ isProcessing: false }));
    }
  }, [
    swapInfo,
    deltafiUser,
    poolConfig,
    sourceAccount,
    walletPubkey,
    sourceBalance,
    swapView,
    tokenFrom,
    tokenTo,
    destinationAccount,
    signTransaction,
    dispatch,
    app,
    program,
  ]);

  const handleSwap = useCallback(async () => {
    if (tokenFrom.amount) {
      setMenu(true, "confirm-swap", undefined, {
        tokenFrom,
        tokenTo,
        slippage: parseFloat(maxSlippage),
        callback: swapCallback,
      });
    }
  }, [tokenFrom, tokenTo, maxSlippage, swapCallback, setMenu]);
  const network = deployConfigV2.network;

  const snackMessasge = useMemo(() => {
    if (!swapView?.transactionResult?.status) {
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

    const { base, quote, signature } = swapView.transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box>
          <Typography variant="body1" color="primary">
            {`Swap ${Number(base.amount).toFixed(base.token.decimals)} ${
              base.token.symbol
            } to ${Number(quote.amount).toFixed(quote.token.decimals)} ${quote.token.symbol} for ${
              base.token.symbol
            }-${quote.token.symbol} Pool`}
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" color="primary">
              View Transaction:
            </Typography>
            <Link
              className={classes.snackBarLink}
              target="_blank"
              href={`${SOLSCAN_LINK}/tx/${signature}?cluster=${network}`}
            >
              {signature.slice(0, 7) + "..." + signature.slice(-7)}
            </Link>
          </Box>
        </Box>
      </Box>
    );
  }, [swapView.transactionResult, classes, network]);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose, classes]);

  const actionButton = useMemo(() => {
    if (isConnectedWallet) {
      const unavailable = !pool;
      const sourceAccountNonExist = !sourceBalance;
      const isInsufficientBalance = sourceBalance?.isLessThan(tokenFrom.amount);
      const isZeroFromAmount = Number(tokenFrom.amount) === 0;
      const isInsufficientLiquidity =
        pool &&
        exponentiatedBy(
          tokenFrom.token.symbol === tokenTo.token.symbol
            ? pool?.poolState.quoteReserve
            : pool?.poolState.baseReserve,
          tokenTo.token.decimals,
        ).isLessThan(tokenTo.amount);

      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="contained"
          disabled={
            unavailable ||
            isZeroFromAmount ||
            sourceAccountNonExist ||
            isInsufficientBalance ||
            isInsufficientLiquidity
          }
          onClick={handleSwap}
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Swap, target: EnterAmount"
        >
          {unavailable ? (
            "unavailable"
          ) : sourceAccountNonExist ? (
            "No " + tokenFrom.token.symbol + " Account in Wallet"
          ) : isInsufficientBalance ? (
            "Insufficient Balance"
          ) : isInsufficientLiquidity ? (
            "Insufficient Liquidity"
          ) : isZeroFromAmount ? (
            "Please Enter Amount"
          ) : swapView.isProcessing ? (
            <Avatar className={classes.actionLoadingButton} src={loadingIcon} />
          ) : (
            "Swap"
          )}
        </ConnectButton>
      );
    }

    return (
      <ConnectButton fullWidth size="large" onClick={() => setMenu(true, "connectV2")}>
        Connect Wallet
      </ConnectButton>
    );
  }, [
    isConnectedWallet,
    handleSwap,
    setMenu,
    sourceBalance,
    pool,
    tokenFrom,
    tokenTo.amount,
    tokenTo.token.decimals,
    swapView.isProcessing,
    tokenTo.token.symbol,
    classes.actionLoadingButton,
  ]);

  const { open, vertical, horizontal } = state;

  return (
    <Page>
      <Container className={classes.container}>
        <Paper className={classes.root}>
          <Box className={classes.ratePanel}>
            <Typography color="primary" variant="body1" className={classes.marketCondition}>
              {`1 ${tokenFrom.token.symbol} = ${exchangeRateLabel} ${tokenTo.token.symbol}`}
            </Typography>
            <ConnectButton
              onClick={handleOpenSettings}
              variant={openSettings ? "contained" : "outlined"}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Swap, target: Settings"
              className={`${classes.maxSlippageBtn} ${openSettings ? "active" : ""}`}
              key="settingBtn"
            >
              {maxSlippage}%
            </ConnectButton>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end">
            <SwapCard
              card={tokenFrom}
              tokens={tokenConfigs}
              handleChangeCard={handleTokenFromInput}
            />
            <Fab
              color="secondary"
              size="small"
              className={classes.swapIcon}
              onClick={handleSwapDirectionChange}
            >
              <SyncAlt />
            </Fab>
            <SwapCard
              card={tokenTo}
              tokens={possibleTokenToConfigs}
              handleChangeCard={handleTokenToInput}
              disabled={true}
            />
          </Box>
          {openSettings && (
            <SettingsPanel
              isOpen={openSettings}
              maxSlippage={maxSlippage}
              handleChangeMaxSlippage={handleChangeMaxSlippage}
              handleClose={handleOpenSettings}
            />
          )}
          <Box marginTop={3} width="100%" position="relative" zIndex={1}>
            {actionButton}
          </Box>
        </Paper>
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

export default Home;
