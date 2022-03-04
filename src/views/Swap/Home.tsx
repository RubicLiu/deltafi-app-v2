import React, { useCallback, useMemo, useState } from "react";
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
import {
  getTokenAccountInfo,
  getTokenInfo,
  parseTokenAccountData,
  useTokenFromMint,
  findTokenAccountByMint,
} from "providers/tokens";
import { usePoolFromSymbols, usePools, updatePoolFromAddress } from "providers/pool";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { swap } from "utils/transactions/swap";
import { useConfig } from "providers/config";
import { DELTAFI_TOKEN_MINT, SOLSCAN_LINK } from "constants/index";
import { usePriceBySymbol } from "providers/pyth";
import { SWAP_DIRECTION } from "lib/instructions";
import { sendSignedTransaction } from "utils/transactions";
import { getSwapOutAmount } from "utils/swap";
import { SwapCard as ISwapCard } from "./components/types";
import { tokens } from "constants/tokens";
import { useCustomConnection } from "providers/connection";
import BigNumber from "bignumber.js";
import { SwapType } from "lib/state";
import { stableSwap } from "utils/transactions/stableSwap";
import { sleep } from "utils/utils";
import loadingIcon from "components/gif/loading_white.gif";
import { PublicKey } from "@solana/web3.js";
import { useSelector } from "react-redux";
import { appSelector } from "states/selectors";

interface TransactionResult {
  status: boolean | null;
  hash?: string;
  base?: ISwapCard;
  quote?: ISwapCard;
}

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

const Home: React.FC = (props) => {
  const appState = useSelector(appSelector);

  const classes = useStyles(props);
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [tokenFrom, setTokenFrom] = useState<ISwapCard>({
    token: getTokenInfo("SOL"),
    amount: "",
    amountWithSlippage: "",
  });
  const [tokenTo, setTokenTo] = useState<ISwapCard>({
    token: getTokenInfo("USDC"),
    amount: "",
    amountWithSlippage: "",
  });
  const { config } = useConfig();
  const { pools } = usePools();
  const pool = usePoolFromSymbols(tokenFrom.token.symbol, tokenTo.token.symbol);
  const sourceAccount = useTokenFromMint(tokenFrom.token.address);
  const destinationAccount = useTokenFromMint(tokenTo.token.address);
  const sourceBalance = useMemo(() => {
    if (sourceAccount && tokenFrom) {
      return exponentiatedBy(sourceAccount.account.amount, tokenFrom.token.decimals);
    }
    return null;
  }, [sourceAccount, tokenFrom]);
  const destinationBalance = useMemo(() => {
    if (destinationAccount && tokenTo) {
      return exponentiatedBy(destinationAccount.account.amount, tokenTo.token.decimals);
    }
    return null;
  }, [destinationAccount, tokenTo]);

  const rewardsAccount = useTokenFromMint(DELTAFI_TOKEN_MINT.toBase58());

  const [isProcessing, setIsProcessing] = useState(false);
  const [priceImpact, setPriceImpact] = useState("2.0");
  const [isIncludeDecimal, setIsIncludeDecimal] = useState(true);
  const [openSettings, setOpenSettings] = useState(false);
  const { setMenu } = useModal();

  const { price: basePrice } = usePriceBySymbol(pool?.baseTokenInfo.symbol);
  const { price: quotePrice } = usePriceBySymbol(pool?.quoteTokenInfo.symbol);

  if (pool?.poolState) {
    if (basePrice && quotePrice) {
      pool.poolState.marketPrice = new BigNumber(basePrice / quotePrice); // market price from the chain is not up-to-date
    } else {
      pool.poolState.marketPrice = new BigNumber(NaN);
    }
  }

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
    vertical: "bottom",
    horizontal: "left",
  });
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({
    status: null,
  });
  const { network } = useCustomConnection();

  const handleSwapDirectionChange = () => {
    const temp = Object.assign({}, tokenFrom);
    setTokenFrom(tokenTo);
    setTokenTo(temp);
  };

  const handleChangeImpact = (value) => {
    setPriceImpact(value);
  };

  const handleChangeInclude = () => {
    setIsIncludeDecimal(!isIncludeDecimal);
  };

  const handleOpenSettings = () => {
    setOpenSettings(!openSettings);
  };

  const handleSnackBarClose = useCallback(() => {
    setState((_state) => ({ ..._state, open: false }));
  }, []);

  const handleTokenFromInput = (card: ISwapCard) => {
    let newTokenFrom = card.token;
    let newTokenTo = tokenTo.token;
    let amountOut = "";
    let amountOutWithSlippage = "";
    if (tokenTo.token.address === newTokenFrom.address) {
      newTokenTo = Object.assign({}, tokenFrom.token);
    }
    if (pool && priceImpact) {
      const { amountOut: quoteAmount, amountOutWithSlippage: quoteAmountWithSlippage } = getSwapOutAmount(
        pool,
        newTokenFrom.address,
        newTokenTo.address,
        card.amount ?? "0",
        parseFloat(priceImpact),
      );

      amountOut = isNaN(quoteAmount) ? "" : Number(quoteAmount).toString();
      amountOutWithSlippage = isNaN(quoteAmountWithSlippage) ? "" : Number(quoteAmountWithSlippage).toString();
    }
    setTokenFrom({ ...tokenFrom, token: newTokenFrom, amount: card.amount });
    setTokenTo({ token: newTokenTo, amount: amountOut, amountWithSlippage: amountOutWithSlippage });
  };

  const handleTokenToInput = (card: ISwapCard) => {
    let newTokenFrom = tokenFrom.token;
    let newTokenTo = card.token;
    let amountOut = "";
    let amountOutWithSlippage = "";
    if (tokenFrom.token.address === newTokenTo.address) {
      newTokenFrom = Object.assign({}, tokenTo.token);
    }
    if (pool && priceImpact) {
      const { amountOut: quoteAmount, amountOutWithSlippage: quoteAmountWithSlippage } = getSwapOutAmount(
        pool,
        newTokenFrom.address,
        newTokenTo.address,
        tokenFrom.amount ?? "0",
        parseFloat(priceImpact),
      );

      amountOut = isNaN(quoteAmount) ? "" : Number(quoteAmount).toString();
      amountOutWithSlippage = isNaN(quoteAmountWithSlippage) ? "" : Number(quoteAmountWithSlippage).toString();
    }
    setTokenFrom({ ...tokenFrom, token: newTokenFrom });
    setTokenTo({ token: newTokenTo, amount: amountOut, amountWithSlippage: amountOutWithSlippage });
  };

  const swapCallback = useCallback(async () => {
    if (!pool || !config || !sourceAccount || !walletPubkey) {
      return null;
    }

    if (sourceBalance.isLessThan(tokenFrom.amount)) {
      return null;
    }

    setIsProcessing(true);
    try {
      const swapMethod = pool.swapType === SwapType.Normal ? swap : stableSwap;
      const referrerPubkey =
        appState.referrer != null && appState.enableReferral ? new PublicKey(appState.referrer) : null;
      const amountIn = BigInt(exponentiate(tokenFrom.amount, tokenFrom.token.decimals).integerValue().toString());
      const minimumAmountOut = BigInt(
        exponentiate(tokenTo.amountWithSlippage, tokenTo.token.decimals).integerValue().toString(),
      );
      const swapDirection =
        tokenFrom.token.symbol === pool.baseTokenInfo.symbol ? SWAP_DIRECTION.SellBase : SWAP_DIRECTION.SellQuote;
      let transaction = await swapMethod({
        connection,
        walletPubkey,
        config,
        pool,
        source: sourceAccount,
        destinationRef: destinationAccount?.pubkey,
        rewardTokenRef: rewardsAccount?.pubkey,
        swapData: {
          amountIn,
          minimumAmountOut,
          swapDirection,
        },
        referrer: referrerPubkey,
      });
      transaction = await signTransaction(transaction);
      const hash = await sendSignedTransaction({ signedTransaction: transaction, connection });

      await connection.confirmTransaction(hash, "confirmed");
      await sleep(0.3); // sleep here to make sure the balance up-to-date
      setTokenFrom((prevTokenFrom) => ({ ...prevTokenFrom, amount: "", lastUpdate: Date.now() }));
      setTokenTo((prevTokenTo) => ({ ...prevTokenTo, amount: "", lastUpdate: Date.now() }));
      const prevBalanceFrom = sourceBalance ?? 0;
      const prevBalanceTo = destinationBalance ?? 0;
      const tokenAccounts = await getTokenAccountInfo(connection, walletPubkey);
      const from = findTokenAccountByMint(tokenAccounts, walletPubkey, tokenFrom.token.address);
      const to = findTokenAccountByMint(tokenAccounts, walletPubkey, tokenTo.token.address);
      if (from && to) {
        const nextBalanceFrom = exponentiatedBy(
          parseTokenAccountData(from.account.data).amount,
          tokenFrom.token.decimals,
        );
        const nextBalanceTo = exponentiatedBy(parseTokenAccountData(to.account.data).amount, tokenTo.token.decimals);
        setTransactionResult({
          status: true,
          hash,
          base: {
            ...tokenFrom,
            amount: nextBalanceFrom.minus(prevBalanceFrom).abs().toString(),
          },
          quote: {
            ...tokenTo,
            amount: nextBalanceTo.minus(prevBalanceTo).abs().toString(),
          },
        });
        // Force update pool state to reflect the balance change.
        await updatePoolFromAddress(connection, pools, pool.publicKey);
        setState((_state) => ({ ..._state, open: true }));
      } else {
        throw Error("Cannot find associated token account to confirm transaction");
      }

      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setTransactionResult({ status: false });
      setState((_state) => ({ ..._state, open: true }));
      setIsProcessing(false);
    }
  }, [
    pool,
    config,
    sourceAccount,
    walletPubkey,
    sourceBalance,
    tokenFrom,
    tokenTo,
    // priceImpact,
    connection,
    destinationAccount?.pubkey,
    rewardsAccount?.pubkey,
    signTransaction,
    destinationBalance,
    appState,
    pools,
  ]);

  const handleSwap = useCallback(async () => {
    if (tokenFrom.amount) {
      setMenu(true, "confirm-swap", undefined, {
        tokenFrom,
        tokenTo,
        slippage: parseFloat(priceImpact),
        callback: swapCallback,
      });
    }
  }, [tokenFrom, tokenTo, priceImpact, swapCallback, setMenu]);

  const snackMessasge = useMemo(() => {
    if (!transactionResult.status) {
      return (
        <Box display="flex" alignItems="center">
          <img src={"/images/snack-fail.svg"} alt="snack-status-icon" className={classes.snackBarIcon} />
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

    const { base, quote, hash } = transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img src={"/images/snack-success.svg"} alt="snack-status-icon" className={classes.snackBarIcon} />
        <Box>
          <Typography variant="body1" color="primary">
            {`Swap ${Number(base.amount).toFixed(6)} ${base.token.symbol} to ${Number(quote.amount).toFixed(6)} ${
              quote.token.symbol
            } for ${base.token.symbol}-${quote.token.symbol} Pool`}
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
    if (isConnectedWallet) {
      const unavailable = !pool;
      const sourceAccountNonExist = !sourceBalance;
      const isInsufficientBalance = sourceBalance?.isLessThan(tokenFrom.amount);
      const isInsufficientLiquidity =
        pool &&
        exponentiatedBy(
          tokenFrom.token.symbol === pool.baseTokenInfo.symbol
            ? pool?.poolState.quoteReserve
            : pool?.poolState.baseReserve,
          tokenFrom.token.symbol === pool.baseTokenInfo.symbol ? tokenTo.token.decimals : tokenFrom.token.decimals,
        ).isLessThan(tokenTo.amount);

      return (
        <ConnectButton
          fullWidth
          size="large"
          variant="outlined"
          disabled={
            unavailable || sourceAccountNonExist || isInsufficientBalance || isInsufficientLiquidity || isProcessing
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
          ) : isProcessing ? (
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
    pool,
    tokenFrom,
    tokenTo.amount,
    tokenTo.token.decimals,
    isProcessing,
    classes.actionLoadingButton,
  ]);

  // if (!pool) return null

  const { open, vertical, horizontal } = state;

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
          <ReactCardFlip isFlipped={openSettings} containerStyle={{ position: "relative", zIndex: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <SwapCard card={tokenFrom} tokens={tokens} handleChangeCard={handleTokenFromInput} />
              {!openSettings && (
                <Fab color="secondary" size="small" className={classes.swapIcon} onClick={handleSwapDirectionChange}>
                  <SyncAlt />
                </Fab>
              )}
              <SwapCard card={tokenTo} tokens={tokens} handleChangeCard={handleTokenToInput} disabled={true} />
            </Box>
            <SettingsPanel
              isOpen={openSettings}
              priceImpact={priceImpact}
              isIncludeDecimal={isIncludeDecimal}
              handleChangeImpact={handleChangeImpact}
              handleChangeInclude={handleChangeInclude}
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
