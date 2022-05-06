import React, { useCallback, useMemo } from "react";
import ReactCardFlip from "react-card-flip";
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
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import SettingsIcon from "@material-ui/icons/Settings";
import SyncAlt from "@material-ui/icons/SyncAlt";
import CloseIcon from "@material-ui/icons/Close";

import Page from "components/layout/Page";
import { ConnectButton } from "components";
import SettingsPanel from "components/SettingsPanel/SettingsPanel";
import SwapCard from "./components/Card";
import { useModal } from "providers/modal";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK } from "constants/index";
import { SWAP_DIRECTION } from "lib/instructions";
import { sendSignedTransaction } from "utils/transactions";
import { getSwapOutAmount } from "utils/swap";
import { SwapCard as ISwapCard } from "./components/types";
import { useCustomConnection } from "providers/connection";
import loadingIcon from "components/gif/loading_white.gif";
import { PublicKey } from "@solana/web3.js";
import { useSelector, useDispatch } from "react-redux";
import {
  selectMarketPriceByPool,
  selectTokenAccountInfoByMint,
  swapViewSelector,
  selectSwapBySwapKey,
  deltafiUserSelector,
  appSelector,
} from "states/selectors";
import BigNumber from "bignumber.js";
import { getTokenBalanceDiffFromTransaction } from "utils/transactions/utils";
import {
  deployConfigV2,
  enableReferral,
  getPoolConfigBySymbols,
  getTokenConfigBySymbol,
  poolConfigs,
  tokenConfigs,
} from "constants/deployConfigV2";
import { swapViewActions } from "states/views/swapView";
import { fecthTokenAccountInfoList } from "states/accounts/tokenAccount";
import { createSwapTransaction } from "utils/transactions/v2/swap";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { BN } from "@project-serum/anchor";
import { fetchDeltafiUserThunk } from "states/accounts/deltafiUserAccount";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    maxWidth: 550,
    margin: "0 auto",
    flex: 1,
  },
  title: {
    textAlign: "start",
    marginBottom: spacing(4),
  },
  root: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      padding: `${spacing(5)}px ${spacing(4)}px`,
      borderRadius: spacing(3),
    },
  },
  swapIcon: {
    transform: "rotate(90deg)",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: -16,
    marginBottom: -16,
    backgroundColor: palette.background.secondary,
    border: `3px solid ${palette.background.primary}`,
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
    fontWeight: "bold",
  },
  snackBarContent: {
    maxWidth: 421,
    backgroundColor: palette.background.lightBlack,
    display: "flex",
    flexWrap: "unset",
    alignItems: "start",
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
  const wallet = useWallet();
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = wallet;
  const { connection } = useConnection();
  const app = useSelector(appSelector);

  const swapView = useSelector(swapViewSelector);
  const tokenFrom = swapView.tokenFrom;
  const tokenTo = swapView.tokenTo;

  const poolConfig = getPoolConfigBySymbols(tokenFrom.token.symbol, tokenTo.token.symbol);
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const deltafiUser = useSelector(deltafiUserSelector).user;

  const sourceAccount = useSelector(selectTokenAccountInfoByMint(tokenFrom.token.mint));
  const destinationAccount = useSelector(selectTokenAccountInfoByMint(tokenTo.token.mint));

  const sourceBalance = useMemo(() => {
    if (sourceAccount && tokenFrom) {
      return exponentiatedBy(sourceAccount.amount, tokenFrom.token.decimals);
    }
    return null;
  }, [sourceAccount, tokenFrom]);

  const { setMenu } = useModal();

  const { marketPrice, basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const exchangeRateLabel = useMemo(() => {
    if (basePrice && quotePrice && swapInfo) {
      if (tokenFrom.token.symbol === poolConfig?.base) {
        return Number(basePrice / quotePrice).toFixed(poolConfig.quoteTokenInfo.decimals);
      } else if (tokenFrom.token.symbol === poolConfig?.quote) {
        return Number(quotePrice / basePrice).toFixed(poolConfig.baseTokenInfo.decimals);
      }
    }
    return "-";
  }, [basePrice, quotePrice, tokenFrom.token.symbol, swapInfo, poolConfig]);

  const { network } = useCustomConnection();

  const possibleTokenToConfigs = useMemo(() => getPossibleTokenToConfigs(tokenFrom), [tokenFrom]);

  const handleSwapDirectionChange = () => {
    const temp = Object.assign({}, tokenFrom);
    dispatch(swapViewActions.setTokenFrom(tokenTo));
    dispatch(swapViewActions.setTokenTo(temp));
  };

  const handleChangeImpact = (value) => {
    dispatch(swapViewActions.setPriceImpact({ priceImpact: value }));
  };

  const handleOpenSettings = () => {
    dispatch(swapViewActions.setOpenSettings({ openSettings: !swapView.openSettings }));
  };

  const handleSnackBarClose = useCallback(() => {
    dispatch(swapViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const handleTokenFromInput = (card: ISwapCard) => {
    let newTokenFrom = card.token;
    let newTokenTo = tokenTo.token;
    let amountOut = "";
    let amountOutWithSlippage = "";
    if (tokenTo.token.mint === newTokenFrom.mint) {
      newTokenTo = Object.assign({}, tokenFrom.token);
    }
    if (swapInfo && swapView.priceImpact) {
      const { amountOut: quoteAmount, amountOutWithSlippage: quoteAmountWithSlippage } =
        getSwapOutAmount(
          swapInfo,
          newTokenFrom,
          newTokenTo,
          card.amount ?? "0",
          parseFloat(swapView.priceImpact),
          marketPrice,
        );

      amountOut = isNaN(quoteAmount) ? "" : Number(quoteAmount).toString();
      amountOutWithSlippage = isNaN(quoteAmountWithSlippage)
        ? ""
        : Number(quoteAmountWithSlippage).toString();
    }
    dispatch(
      swapViewActions.setTokenFrom({ ...tokenFrom, token: newTokenFrom, amount: card.amount }),
    );
    dispatch(
      swapViewActions.setTokenTo({
        token: newTokenTo,
        amount: amountOut,
        amountWithSlippage: amountOutWithSlippage,
      }),
    );
  };

  const handleTokenToInput = (card: ISwapCard) => {
    let newTokenFrom = tokenFrom.token;
    let newTokenTo = card.token;
    let amountOut = "";
    let amountOutWithSlippage = "";
    if (tokenFrom.token.mint === newTokenTo.mint) {
      newTokenFrom = Object.assign({}, tokenTo.token);
    }
    if (swapInfo && swapView.priceImpact) {
      const { amountOut: quoteAmount, amountOutWithSlippage: quoteAmountWithSlippage } =
        getSwapOutAmount(
          swapInfo,
          newTokenFrom,
          newTokenTo,
          tokenFrom.amount ?? "0",
          parseFloat(swapView.priceImpact),
          marketPrice,
        );

      amountOut = isNaN(quoteAmount) ? "" : Number(quoteAmount).toString();
      amountOutWithSlippage = isNaN(quoteAmountWithSlippage)
        ? ""
        : Number(quoteAmountWithSlippage).toString();
    }
    dispatch(swapViewActions.setTokenFrom({ ...tokenFrom, token: newTokenFrom }));
    dispatch(
      swapViewActions.setTokenTo({
        token: newTokenTo,
        amount: amountOut,
        amountWithSlippage: amountOutWithSlippage,
      }),
    );
  };

  const swapCallback = useCallback(async () => {
    if (!swapInfo || !sourceAccount || !walletPubkey) {
      return null;
    }

    if (sourceBalance.isLessThan(tokenFrom.amount)) {
      return null;
    }

    dispatch(swapViewActions.setIsProcessing({ isProcessing: true }));
    try {
      const amountIn = BigInt(
        exponentiate(tokenFrom.amount, tokenFrom.token.decimals).integerValue().toString(),
      );
      //      const minimumAmountOut = BigInt(
      //        exponentiate(tokenTo.amountWithSlippage, tokenTo.token.decimals).integerValue().toString(),
      //      );
      const swapDirection =
        tokenFrom.token.mint === swapInfo.mintBase.toBase58()
          ? SWAP_DIRECTION.SellBase
          : SWAP_DIRECTION.SellQuote;

      const program = getDeltafiDexV2(
        new PublicKey(deployConfigV2.programId),
        makeProvider(connection, wallet),
      );

      const referrer = enableReferral ?  deltafiUser?.referrer || app.referrer : null;
      console.info(referrer);

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
          new BN(amountIn.toString()),
          // TODO(ypeng): Set proper min out amount
          new BN(0),
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

      const actualAmountFrom = new BigNumber(-fromTokenBalanceDiff - fromProcessFee);
      const actualAmountTo = new BigNumber(toTokenBalanceDiff + toProcessFee);

      dispatch(
        swapViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            signature,
            base: {
              ...tokenFrom,
              amount: exponentiatedBy(actualAmountFrom, tokenFrom.token.decimals).toString(),
            },
            quote: {
              ...tokenTo,
              amount: exponentiatedBy(actualAmountTo, tokenTo.token.decimals).toString(),
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
    wallet,
    sourceAccount,
    walletPubkey,
    sourceBalance,
    swapView,
    tokenFrom,
    tokenTo,
    connection,
    destinationAccount,
    signTransaction,
    dispatch,
  ]);

  const handleSwap = useCallback(async () => {
    if (tokenFrom.amount) {
      setMenu(true, "confirm-swap", undefined, {
        tokenFrom,
        tokenTo,
        slippage: parseFloat(swapView.priceImpact),
        callback: swapCallback,
      });
    }
  }, [tokenFrom, tokenTo, swapView, swapCallback, setMenu]);

  const snackMessasge = useMemo(() => {
    if (!swapView.transactionResult || !swapView.transactionResult.status) {
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
  }, [swapView, classes, network]);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose, classes]);

  const actionButton = useMemo(() => {
    if (isConnectedWallet) {
      const unavailable = !swapInfo;
      const sourceAccountNonExist = !sourceBalance;
      const isInsufficientBalance = sourceBalance?.isLessThan(tokenFrom.amount);
      const isInsufficientLiquidity =
        swapInfo &&
        exponentiatedBy(
          tokenFrom.token.symbol === poolConfig.base
            ? new BigNumber(swapInfo?.poolState.quoteReserve.toString())
            : new BigNumber(swapInfo?.poolState.baseReserve.toString()),
          tokenTo.token.decimals,
        ).isLessThan(tokenTo.amount);

      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="outlined"
          disabled={
            unavailable ||
            sourceAccountNonExist ||
            isInsufficientBalance ||
            isInsufficientLiquidity ||
            swapView.isProcessing
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
          ) : swapView.isProcessing ? (
            <Avatar className={classes.actionLoadingButton} src={loadingIcon} />
          ) : (
            "Swap"
          )}
        </ConnectButton>
      );
    }

    return (
      <ConnectButton fullWidth size="large" onClick={() => setMenu(true, "connect")}>
        Connect Wallet
      </ConnectButton>
    );
  }, [
    isConnectedWallet,
    handleSwap,
    setMenu,
    sourceBalance,
    swapInfo,
    poolConfig,
    tokenFrom,
    tokenTo.amount,
    tokenTo.token.decimals,
    swapView,
    classes.actionLoadingButton,
  ]);

  const vertical = "bottom";
  const horizontal = "left";

  return (
    <Page>
      <Container className={classes.container}>
        <Typography variant="h5" color="primary" align="center" paragraph className={classes.title}>
          Swap
        </Typography>
        <Paper className={classes.root}>
          <Box className={classes.ratePanel}>
            <Typography color="primary" variant="body1" className={classes.marketCondition}>
              {`1 ${tokenFrom.token.symbol} = ${exchangeRateLabel} ${tokenTo.token.symbol}`}
            </Typography>
            <IconButton
              onClick={handleOpenSettings}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Swap, target: Settings"
            >
              <SettingsIcon color="primary" />
            </IconButton>
          </Box>
          <ReactCardFlip
            isFlipped={swapView.openSettings}
            containerStyle={{ position: "relative", zIndex: 2 }}
          >
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <SwapCard
                card={tokenFrom}
                tokens={tokenConfigs}
                handleChangeCard={handleTokenFromInput}
              />
              {!swapView.openSettings && (
                <Fab
                  color="secondary"
                  size="small"
                  className={classes.swapIcon}
                  onClick={handleSwapDirectionChange}
                >
                  <SyncAlt />
                </Fab>
              )}
              <SwapCard
                card={tokenTo}
                tokens={possibleTokenToConfigs}
                handleChangeCard={handleTokenToInput}
                disabled={true}
              />
            </Box>
            <SettingsPanel
              isOpen={swapView.openSettings}
              priceImpact={swapView.priceImpact}
              handleChangeImpact={handleChangeImpact}
              handleClose={handleOpenSettings}
            />
          </ReactCardFlip>
          <Box marginTop={2} width="100%" position="relative" zIndex={1}>
            {actionButton}
          </Box>
        </Paper>
      </Container>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={swapView.openSnackbar}
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
