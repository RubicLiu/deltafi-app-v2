import React, { useCallback, useMemo } from "react";
import {
  Typography,
  IconButton,
  makeStyles,
  Theme,
  Paper,
  Box,
  Fab,
  Snackbar,
  SnackbarContent,
  Link,
  Avatar,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import { useWallet } from "@solana/wallet-adapter-react";
import SearchIcon from "@material-ui/icons/Search";
import SyncAlt from "@material-ui/icons/SyncAlt";
import CloseIcon from "@material-ui/icons/Close";

import Page from "components/layout/Page";
import { ConnectButton } from "components";
import SettingsPanel from "components/SettingsPanel/SettingsPanel";
import SwapCard from "./components/Card";
import { useModal } from "providers/modal";
import { exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK, TOKEN_PRICE_DECIMALS } from "constants/index";
import { SWAP_DIRECTION } from "lib/instructions";
import { sendSignedTransaction } from "utils/transactions";
import { getSwapInResult, getSwapOutResult } from "utils/swap";
import { SwapCard as ISwapCard } from "./components/types";
import { PublicKey } from "@solana/web3.js";
import { useSelector, useDispatch } from "react-redux";
import {
  selectMarketPriceByPool,
  selectTokenAccountInfoByMint,
  swapViewSelector,
  selectSwapBySwapKey,
  deltafiUserSelector,
  appSelector,
  programSelector,
  poolSelector,
  pythSelector,
} from "states/selectors";
import { getTokenBalanceDiffFromTransaction } from "utils/transactions/utils";
import {
  deployConfigV2,
  enableReferral,
  getPoolConfigBySymbols,
  getTokenConfigBySymbol,
  PoolConfig,
  poolConfigs,
  TokenConfig,
  tokenConfigs,
} from "constants/deployConfigV2";
import { swapViewActions } from "states/views/swapView";
import { fecthTokenAccountInfoList } from "states/accounts/tokenAccount";
import { createSwapTransaction } from "utils/transactions/swap";
import { BN } from "@project-serum/anchor";
import { fetchDeltafiUserThunk } from "states/accounts/deltafiUserAccount";
import { anchorBnToBn, anchorBnToString, stringToAnchorBn } from "utils/tokenUtils";
import { DeltafiUser, SwapInfo } from "anchor/type_definitions";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import CompareArrows from "components/Svg/icons/CompareArrows";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import BigNumber from "bignumber.js";

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    maxWidth: 550,
    margin: "0 auto",
    flex: 1,
  },
  searchCt: {
    marginBottom: 10,
    [breakpoints.up("md")]: {
      marginBottom: 15,
    },
  },
  title: {
    textAlign: "start",
    marginBottom: spacing(4),
  },
  root: {
    marginBottom: spacing(2.5),
    background: palette.background.primary,
    borderRadius: spacing(2),
    padding: `${spacing(2)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      padding: `${spacing(4)}px ${spacing(4)}px`,
      borderRadius: spacing(3),
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
    marginBottom: spacing(1.5),
    [breakpoints.up("sm")]: {
      marginBottom: spacing(2.5),
    },
  },
  marketCondition: {
    fontWeight: 400,
  },
  snackBarContent: {
    maxWidth: 393,
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
    "& .MuiAutocomplete-option": {
      height: 70,
      "&:hover": {
        background:
          "linear-gradient(111.31deg, rgba(212, 255, 0, 0.1) 15.34%, rgba(189, 255, 0, 0.1) 95.74%)",
      },
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
    marginTop: 6,
  },
  maxSlippageBtn: {
    height: 30,
    borderRadius: 50,
    "& span": {
      fontWeight: 400,
      fontSize: 12,
      lineHeight: "14px",
    },
    padding: "1px !important",
  },
  currency: {
    background: palette.background.secondary,
    borderRadius: 20,
    padding: "24px 24px",
    marginTop: 20,
    fontSize: 12,
    color: palette.text.dark,
    lineHeight: 1,
  },
  currencyCt: {
    display: "flex",
    height: "32px",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  compareArrow: {
    marginLeft: 3,
    marginRight: 3,
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
  const app = useSelector(appSelector);
  const program = useSelector(programSelector);

  const swapView = useSelector(swapViewSelector);
  const tokenFrom = swapView.tokenFrom;
  const tokenTo = swapView.tokenTo;

  const poolConfig: PoolConfig = getPoolConfigBySymbols(
    tokenFrom.token.symbol,
    tokenTo.token.symbol,
  );
  const swapInfo: SwapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));
  const swapKeyToSwapInfo = useSelector(poolSelector).swapKeyToSwapInfo;
  const symbolToPythPriceData = useSelector(pythSelector).symbolToPythPriceData;

  const deltafiUser: DeltafiUser = useSelector(deltafiUserSelector).user;

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

  const network = deployConfigV2.network;
  const possibleTokenToConfigs = useMemo(() => getPossibleTokenToConfigs(tokenFrom), [tokenFrom]);

  const getPoolTradingVolumeFromPoolConfig = useCallback(
    (poolConfig: PoolConfig) => {
      const basePrice = new BigNumber(symbolToPythPriceData[poolConfig.base]?.price);
      const quotePrice = new BigNumber(symbolToPythPriceData[poolConfig.quote]?.price);
      const baseVolume = anchorBnToBn(
        poolConfig.baseTokenInfo,
        swapKeyToSwapInfo[poolConfig.swapInfo]?.poolState?.totalTradedBase,
      ).multipliedBy(basePrice);
      const quoteVolume = anchorBnToBn(
        poolConfig.quoteTokenInfo,
        swapKeyToSwapInfo[poolConfig.swapInfo]?.poolState?.totalTradedQuote,
      ).multipliedBy(quotePrice);
      return baseVolume.plus(quoteVolume);
    },
    [symbolToPythPriceData, swapKeyToSwapInfo],
  );

  const poolConfigsSortedByVolume = useMemo(
    () =>
      poolConfigs.sort((poolConfigA: PoolConfig, poolConfigB: PoolConfig) => {
        const volumeA = getPoolTradingVolumeFromPoolConfig(poolConfigA);
        const volumeB = getPoolTradingVolumeFromPoolConfig(poolConfigB);

        if (volumeA.isNaN() || volumeB.isNaN() || volumeB.isEqualTo(volumeA)) {
          return poolConfigA.name < poolConfigB.name ? 1 : -1;
        }
        return volumeB.minus(volumeA).toNumber();
      }),
    [getPoolTradingVolumeFromPoolConfig],
  );

  const handleSwapDirectionChange = () => {
    const temp = Object.assign({}, tokenFrom);
    dispatch(swapViewActions.setTokenFrom(tokenTo));
    dispatch(swapViewActions.setTokenTo(temp));
  };

  const handleChangeMaxSlippage = (value) => {
    dispatch(swapViewActions.setMaxSlippage({ maxSlippage: value }));
  };

  const handleOpenSettings = () => {
    dispatch(swapViewActions.setOpenSettings({ openSettings: !swapView.openSettings }));
  };

  const handleSettingClickAway = () => {
    dispatch(swapViewActions.setOpenSettings({ openSettings: false }));
  };

  const handleSnackBarClose = useCallback(() => {
    dispatch(swapViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const handleTokenFromInput = (card: ISwapCard) => {
    let newTokenFrom: TokenConfig = card.token;
    let newTokenTo: TokenConfig = tokenTo.token;
    if (tokenTo.token.mint === newTokenFrom.mint) {
      newTokenTo = Object.assign({}, tokenFrom.token);
    }

    if (newTokenTo.mint !== tokenTo.token.mint || newTokenFrom.mint !== tokenFrom.token.mint) {
      // change buy/sell token, clear the input/output to 0
      dispatch(swapViewActions.setTokenFrom({ ...tokenFrom, token: newTokenFrom, amount: "" }));
      dispatch(swapViewActions.setTokenTo({ ...tokenTo, token: newTokenTo, amount: "" }));
      return;
    }

    const {
      priceImpact,
      insufficientLiquidity,
      amountOut: quoteAmount,
      amountOutWithSlippage: quoteAmountWithSlippage,
    } = getSwapOutResult(
      swapInfo,
      newTokenFrom,
      newTokenTo,
      card.amount ?? "0",
      parseFloat(swapView.maxSlippage),
      marketPrice,
    );

    dispatch(swapViewActions.setInsufficientLiquidity({ insufficientLiquidity }));
    dispatch(swapViewActions.setPriceImpact({ priceImpact }));

    const amountOut = quoteAmount === "NaN" ? "" : quoteAmount;
    const amountOutWithSlippage = quoteAmountWithSlippage === "NaN" ? "" : quoteAmountWithSlippage;

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
    if (tokenFrom.token.mint === newTokenTo.mint) {
      newTokenFrom = Object.assign({}, tokenTo.token);
    }

    if (newTokenTo.mint !== tokenTo.token.mint || newTokenFrom.mint !== tokenFrom.token.mint) {
      // change buy/sell token, clear the input/output to 0
      dispatch(swapViewActions.setTokenFrom({ ...tokenFrom, token: newTokenFrom, amount: "" }));
      dispatch(swapViewActions.setTokenTo({ ...tokenTo, token: newTokenTo, amount: "" }));
      return;
    }

    const {
      priceImpact,
      insufficientLiquidity,
      amountIn: baseAmount,
      amountOutWithSlippage: quoteAmountWithSlippage,
    } = getSwapInResult(
      swapInfo,
      newTokenFrom,
      newTokenTo,
      card.amount ?? "0",
      parseFloat(swapView.maxSlippage),
      marketPrice,
    );

    dispatch(swapViewActions.setInsufficientLiquidity({ insufficientLiquidity }));
    dispatch(swapViewActions.setPriceImpact({ priceImpact }));

    const amountIn = baseAmount === "NaN" ? "" : baseAmount;
    const amountOutWithSlippage = quoteAmountWithSlippage === "NaN" ? "" : quoteAmountWithSlippage;

    dispatch(
      swapViewActions.setTokenTo({
        ...tokenTo,
        token: newTokenTo,
        amount: card.amount,
        amountWithSlippage: amountOutWithSlippage,
      }),
    );
    dispatch(
      swapViewActions.setTokenFrom({
        ...tokenFrom,
        token: newTokenFrom,
        amount: amountIn,
      }),
    );
  };

  const handleTradePairChange = (event, value) => {
    if (value) {
      dispatch(
        swapViewActions.setTokenFrom({
          ...tokenFrom,
          token: getTokenConfigBySymbol(value.tokenFrom),
          amount: "0",
        }),
      );
      dispatch(
        swapViewActions.setTokenTo({
          ...tokenTo,
          token: getTokenConfigBySymbol(value.tokenTo),
          amount: "0",
        }),
      );
    }
  };

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
      const referrer = enableReferral ? deltafiUser?.referrer || app.referrer : null;
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
        slippage: swapView.maxSlippage,
        priceImpact: swapView.priceImpact,
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
            } to ${Number(quote.amount).toFixed(quote.token.decimals)} ${quote.token.symbol}`}
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
      // TODO(leqiang): remove this variabe and use a swapView state instead
      const isInsufficientBalance = sourceBalance?.isLessThan(tokenFrom.amount);

      return (
        <ConnectButton
          fullWidth
          size="large"
          disabled={
            unavailable ||
            sourceAccountNonExist ||
            isInsufficientBalance ||
            swapView.insufficientLiquidity ||
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
          ) : swapView.insufficientLiquidity ? (
            "Insufficient Liquidity"
          ) : swapView.isProcessing ? (
            <CircularProgress color="inherit" />
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
  }, [isConnectedWallet, handleSwap, setMenu, sourceBalance, swapInfo, tokenFrom, swapView]);

  const vertical = "top";
  const horizontal = "right";

  return (
    <Page>
      <Box className={classes.container}>
        <Autocomplete
          renderInput={(params) => {
            return (
              <TextField
                placeholder="TOP traded pairs"
                className={classes.textField}
                {...params}
                InputProps={Object.assign(params.InputProps, {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: "rgba(255, 255, 255, 0.5)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: null,
                })}
                margin="normal"
              />
            );
          }}
          onChange={handleTradePairChange}
          getOptionLabel={(option) => `${option.tokenFrom} - ${option.tokenTo}`}
          renderOption={(option) => {
            const tokenFrom = getTokenConfigBySymbol(option.tokenFrom);
            const tokenTo = getTokenConfigBySymbol(option.tokenTo);
            return (
              <Box display="flex" alignItems="center">
                <Box display="flex" alignItems="center" marginLeft="30px">
                  <Avatar
                    src={tokenFrom?.logoURI}
                    alt={tokenFrom?.symbol}
                    className={classes.icon}
                  />
                  <Box className={classes.compareArrow}>
                    <CompareArrows />
                  </Box>
                  <Avatar src={tokenTo?.logoURI} alt={tokenTo?.symbol} className={classes.icon} />
                </Box>
                <Box marginLeft="20px">
                  <Typography className={classes.tradePairTitle}>
                    {option.tokenFrom} - {option.tokenTo}
                  </Typography>
                  <Typography className={classes.tradePairName}>
                    {tokenFrom.name} - {tokenTo.name}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          options={poolConfigsSortedByVolume.map((poolConfig) => ({
            tokenFrom: poolConfig.base,
            tokenTo: poolConfig.quote,
          }))}
          classes={{ paper: classes.optionsPaper }}
          className={classes.searchCt}
        ></Autocomplete>
        <Paper className={classes.root}>
          <Box className={classes.ratePanel}>
            <Typography color="primary" variant="body1" className={classes.marketCondition}>
              {`1 ${tokenFrom.token.symbol} = ${exchangeRateLabel} ${tokenTo.token.symbol}`}
            </Typography>
            <ConnectButton
              onClick={handleOpenSettings}
              variant={swapView.openSettings ? "contained" : "outlined"}
              data-amp-analytics-on="click"
              data-amp-analytics-name="click"
              data-amp-analytics-attrs="page: Swap, target: Settings"
              className={`${classes.maxSlippageBtn} ${swapView.openSettings ? "active" : ""}`}
              key="settingBtn"
            >
              {swapView.maxSlippage}%
            </ConnectButton>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end">
            <SwapCard
              card={tokenFrom}
              tokens={tokenConfigs}
              handleChangeCard={handleTokenFromInput}
            />
            <Fab
              color="inherit"
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
            />
          </Box>
          {swapView.openSettings && (
            <ClickAwayListener onClickAway={handleSettingClickAway}>
              <SettingsPanel
                isOpen={swapView.openSettings}
                maxSlippage={swapView.maxSlippage}
                handleChangeMaxSlippage={handleChangeMaxSlippage}
                handleClose={handleOpenSettings}
              />
            </ClickAwayListener>
          )}
          <Paper className={`${classes.root} ${classes.currency}`}>
            <Grid
              container
              alignItems="center"
              style={{ rowGap: "16px" }}
              spacing={1}
              justifyContent="center"
            >
              <Grid item xs={6} sm={4} style={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  src={poolConfig?.baseTokenInfo?.logoURI}
                  alt={poolConfig?.baseTokenInfo?.symbol}
                  className={classes.icon}
                />
                <Box marginLeft={0.5} className={classes.currencyCt}>
                  <Box sx={{ color: "#fff", fontSize: "16px" }}>
                    {poolConfig?.baseTokenInfo?.symbol}
                  </Box>
                  <Box>{poolConfig?.baseTokenInfo?.name}</Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box className={classes.currencyCt}>
                  <Box>Price</Box>
                  <Box sx={{ color: "#fff" }}>{`$${
                    basePrice ? basePrice.toFixed(TOKEN_PRICE_DECIMALS) : "--"
                  }`}</Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={2}></Grid>
              <Grid item xs={6} sm={3}></Grid>
              <Grid item xs={6} sm={4} style={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  src={poolConfig?.quoteTokenInfo?.logoURI}
                  alt={poolConfig?.quoteTokenInfo?.symbol}
                  className={classes.icon}
                />
                <Box marginLeft={0.5} className={classes.currencyCt}>
                  <Box sx={{ color: "#fff", fontSize: "16px" }}>
                    {poolConfig?.quoteTokenInfo?.symbol}
                  </Box>
                  <Box>{poolConfig?.quoteTokenInfo?.name}</Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box className={classes.currencyCt}>
                  <Box>Price</Box>
                  <Box sx={{ color: "#fff" }}>{`$${
                    quotePrice ? quotePrice.toFixed(TOKEN_PRICE_DECIMALS) : "--"
                  }`}</Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={2}></Grid>
              <Grid item xs={6} sm={3}></Grid>
            </Grid>
          </Paper>
          <Box marginTop={2.25} width="100%" position="relative" zIndex={1}>
            {actionButton}
          </Box>
        </Paper>
      </Box>
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
