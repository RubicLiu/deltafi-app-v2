import { ReactElement, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import {
  Snackbar,
  SnackbarContent,
  Box,
  Typography,
  Paper,
  Button as MUIButton,
  IconButton,
  Link,
  Container,
  Avatar,
} from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import BigNumber from "bignumber.js";

import StakeCard from "views/Stake/components/Card";
import Page from "components/layout/Page";
import { ConnectButton, LinkIcon } from "components";

import useStyles from "./styles";
import { useModal } from "providers/modal";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK, DELTAFI_TOKEN_DECIMALS } from "constants/index";
import { useCustomConnection } from "providers/connection";
import Slider from "./components/Slider";
import loadingIcon from "components/gif/loading_white.gif";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLpUserBySwapKey,
  selectFarmByFarmKey,
  selectTokenAccountInfoByMint,
  stakeSelector,
} from "states/v2/selectorsV2";
import { getPoolConfigByFarmKey, getTokenConfigBySymbol } from "constants/deployConfigV2";
import { tokenConfigs } from "constants/deployConfig";
import { stakeV2Actions } from "states/v2/stakeV2State";

const SECONDS_OF_YEAR = 31556926;

const getUnclaimedReward = (
  apr: BigNumber,
  lastUpdateTs: BigNumber,
  nextClaimTs: BigNumber,
  rewardsOwed: BigNumber,
  depositBalance: BigNumber,
  deltafiTokenDecimals: number,
) => {
  const currentTs: BigNumber = new BigNumber(Date.now()).div(new BigNumber(1000));
  if (currentTs <= nextClaimTs) {
    return new BigNumber(0);
  }
  const unTrackedReward: BigNumber = currentTs
    .minus(lastUpdateTs)
    .div(new BigNumber(SECONDS_OF_YEAR))
    .multipliedBy(depositBalance)
    .multipliedBy(apr);

  return exponentiatedBy(unTrackedReward.plus(rewardsOwed), deltafiTokenDecimals);
};

const Stake = (): ReactElement => {
  const classes = useStyles();
  const location = useLocation();

  const farmPoolId = location.pathname.split("/").pop();
  const farmPool = useSelector(selectFarmByFarmKey(farmPoolId));
  const poolConfig = getPoolConfigByFarmKey(farmPoolId);
  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;

  const lpUser = useSelector(selectLpUserBySwapKey(poolConfig.swapInfo));

  const { connected: isConnectedWallet } = useWallet();
  const { network } = useCustomConnection();
  const token = getTokenConfigBySymbol(farmPool?.name);
  const tokenAccount = useSelector(selectTokenAccountInfoByMint(token?.mint));

  const { setMenu } = useModal();
  const dispatch = useDispatch();
  const stakeV2 = useSelector(stakeSelector);
  const vertical = "bottom";
  const horizontal = "left";

  const tokenBalance = useMemo(() => {
    return tokenAccount ? exponentiatedBy(tokenAccount.amount, token.decimals) : new BigNumber(0);
  }, [tokenAccount, token]);

  const baseTotalStaked = useMemo(() => {
    return farmPool
      ? exponentiatedBy(farmPool.stakedBaseShare.toString(), poolConfig.baseTokenInfo.decimals)
      : new BigNumber(0);
  }, [farmPool, poolConfig]);

  const quoteTotalStaked = useMemo(() => {
    return farmPool
      ? exponentiatedBy(farmPool.stakedQuoteShare.toString(), poolConfig.quoteTokenInfo.decimals)
      : new BigNumber(0);
  }, [farmPool, poolConfig]);

  const baseApr = new BigNumber(farmPool?.farmConfig.baseAprNumerator.toString()).div(
    new BigNumber(farmPool?.farmConfig.baseAprDenominator.toString()),
  );

  const quoteApr = new BigNumber(farmPool?.farmConfig.quoteAprNumerator.toString()).div(
    new BigNumber(farmPool?.farmConfig.quoteAprDenominator.toString()),
  );

  const userBaseShare = lpUser ? lpUser.baseShare.toString() : "0";
  const userQuoteShare = lpUser ? lpUser.quoteShare.toString() : "0";
  const userBaseStaked = lpUser ? lpUser.basePosition.depositedAmount.toString() : "0";
  const userQuoteStaked = lpUser ? lpUser.quotePosition.depositedAmount.toString() : "0";

  // TODO(ypeng): Use staked base quote amounts.
  const depositAmount = useMemo(() => {
    return new BigNumber(0);
  }, []);

  useEffect(() => {
    if (poolConfig) {
      dispatch(stakeV2Actions.setPoolConfig({ poolConfig }));
    }
  }, [baseTokenInfo, quoteTokenInfo, dispatch, poolConfig]);

  const staking = stakeV2.stake;

  const percentage = staking.percentage;
  const setStakePercentage = useCallback(
    (percentage: number) => {
      const realAmount = staking.balance
        .multipliedBy(new BigNumber(percentage))
        .dividedBy(new BigNumber(100));
      const amount = realAmount.toNumber() < 1e-6 ? "0.000000" : realAmount.toString();
      dispatch(stakeV2Actions.setPercentage({ percentage, amount }));
    },
    [dispatch, staking],
  );

  const setStakeAmount = useCallback(
    (value: string) => {
      let percentage = new BigNumber(0);
      let amount = value !== "" ? value : "0";
      if (staking.balance) {
        percentage = new BigNumber(amount).multipliedBy(100).dividedBy(staking.balance);
        if (percentage === new BigNumber(NaN)) {
          percentage = new BigNumber(0);
        } else if (percentage.comparedTo(new BigNumber(100)) > 0) {
          percentage = new BigNumber(100);
          amount = staking.balance.toString();
        }
      }
      dispatch(stakeV2Actions.setPercentage({ percentage: Number(percentage.toFixed(2)), amount }));
    },
    [dispatch, staking],
  );

  useEffect(() => {
    const isStake = staking.isStake;
    dispatch(stakeV2Actions.setIsStake({
      isStake,
      baseBalance: new BigNumber(isStake ? userBaseShare : userBaseStaked ),
      quoteBalance: new BigNumber(isStake ? userQuoteShare : userQuoteStaked)
    }));
  }, [dispatch, staking, userBaseShare, userQuoteShare, userBaseStaked, userQuoteStaked]);

  const unclaimedReward = (() => {
    if (lpUser) {
      const baseReward = getUnclaimedReward(
        baseApr,
        lpUser.basePosition.lastUpdateTs,
        lpUser.basePosition.nextClaimTs,
        lpUser.basePosition.rewardsOwed,
        lpUser.basePosition.depositedAmount,
        DELTAFI_TOKEN_DECIMALS,
      );
      const quoteReward = getUnclaimedReward(
        quoteApr,
        lpUser.quotePosition.lastUpdateTs,
        lpUser.quotePosition.nextClaimTs,
        lpUser.quotePosition.rewardsOwed,
        lpUser.quotePosition.depositedAmount,
        DELTAFI_TOKEN_DECIMALS,
      );
      return baseReward.plus(quoteReward);
    }
    return new BigNumber(0);
  })();

  const basePoolRateByDay = useMemo(() => {
    if (farmPool && baseTotalStaked && baseTokenInfo) {
      return exponentiatedBy(
        exponentiate(baseTotalStaked.multipliedBy(baseApr).dividedBy(365), baseTokenInfo.decimals),
        DELTAFI_TOKEN_DECIMALS,
      ).toFixed(6);
    }
    return "--";
  }, [farmPool, baseTokenInfo, baseApr, baseTotalStaked]);

  const quotePoolRateByDay = useMemo(() => {
    if (farmPool && quoteTotalStaked && quoteTokenInfo) {
      return exponentiatedBy(
        exponentiate(
          quoteTotalStaked.multipliedBy(quoteApr).dividedBy(365),
          quoteTokenInfo.decimals,
        ),
        DELTAFI_TOKEN_DECIMALS,
      ).toFixed(6);
    }
    return "--";
  }, [farmPool, quoteTokenInfo, quoteApr, quoteTotalStaked]);

  const rewardRateByDay = useMemo(() => {
    if (lpUser && baseApr && quoteApr) {
      const baseRate = exponentiatedBy(
        exponentiate(
          new BigNumber(userBaseStaked).multipliedBy(baseApr).dividedBy(365),
          baseTokenInfo.decimals,
        ),
        DELTAFI_TOKEN_DECIMALS,
      );
      const quoteRate = exponentiatedBy(
        exponentiate(
          new BigNumber(userQuoteStaked).multipliedBy(quoteApr).dividedBy(365),
          quoteTokenInfo.decimals,
        ),
        DELTAFI_TOKEN_DECIMALS,
      );
      return baseRate.plus(quoteRate).toFixed(6);
    }
    return "0";
  }, [userBaseStaked, userQuoteStaked, baseApr, quoteApr, lpUser, baseTokenInfo, quoteTokenInfo]);

  const handleSwitchMethod = useCallback((method: "stake" | "unstake") => {
    const isStake = method === "stake";
    dispatch(stakeV2Actions.setIsStake({
      isStake,
      baseBalance: new BigNumber(isStake ? userBaseShare : userBaseStaked ),
      quoteBalance: new BigNumber(isStake ? userQuoteShare : userQuoteStaked)
    }));
  }, [dispatch, staking, userBaseShare, userQuoteShare, userBaseStaked, userQuoteStaked]);

  const handleStake = useCallback(
    async () => {
      // TODO(ypeng): Implement v2 transaction.
      //    if (!connection || !farmPool || !walletPubkey || !lpTokenConfig || !lpToken) {
      //      return null;
      //    }
      //    if (staking.isStake) {
      //      if (staking.amount === "" || new BigNumber(lpToken.amount).lt(staking.amount)) {
      //        return null;
      //      }
      //
      //      setIsProcessingStake(true);
      //      try {
      //        const transaction = await stake({
      //          connection,
      //          walletPubkey,
      //          config,
      //          farmPool,
      //          farmUser: farmUser?.publicKey,
      //          poolTokenAccount: lpToken,
      //          stakeData: {
      //            amount: BigInt(
      //              exponentiate(staking.amount, lpTokenConfig.decimals).integerValue().toString(),
      //            ),
      //          },
      //        });
      //
      //        const signedTransaction = await signTransaction(transaction);
      //        const hash = await sendSignedTransaction({
      //          signedTransaction,
      //          connection,
      //        });
      //
      //        await connection.confirmTransaction(hash, "confirmed");
      //
      //        await fecthTokenAccountInfoList(
      //          [farmPool?.poolMintKey.toBase58()],
      //          walletPubkey,
      //          connection,
      //          dispatch,
      //        );
      //        setStaking((prevStaking) => ({
      //          ...prevStaking,
      //          amount: "0",
      //          percentage: 0,
      //        }));
      //        setTransactionResult({
      //          status: true,
      //          action: "stake",
      //          hash,
      //          stake: staking,
      //        });
      //      } catch (e) {
      //        setStaking((prevStaking) => ({
      //          ...prevStaking,
      //          amount: "0",
      //          percentage: 0,
      //        }));
      //      } finally {
      //        setState((state) => ({ ...state, open: true }));
      //        setIsProcessingStake(false);
      //        dispatch(
      //          fetchFarmUsersThunk({
      //            connection,
      //            walletAddress: walletPubkey,
      //          }),
      //        );
      //      }
      //    } else {
      //      if (staking.amount === "" || !position || depositAmount.lt(staking.amount)) {
      //        return null;
      //      }
      //
      //      setIsProcessingStake(true);
      //      try {
      //        const transaction = await unstake({
      //          connection,
      //          walletPubkey,
      //          config,
      //          farmPool,
      //          farmUser: farmUser?.publicKey,
      //          poolTokenAccount: lpToken,
      //          unstakeData: {
      //            amount: BigInt(
      //              exponentiate(staking.amount, lpTokenConfig.decimals).integerValue().toString(),
      //            ),
      //          },
      //        });
      //
      //        const signedTransaction = await signTransaction(transaction);
      //        const hash = await sendSignedTransaction({
      //          signedTransaction,
      //          connection,
      //        });
      //
      //        await connection.confirmTransaction(hash, "confirmed");
      //        await fecthTokenAccountInfoList(
      //          [farmPool?.poolMintKey.toBase58()],
      //          walletPubkey,
      //          connection,
      //          dispatch,
      //        );
      //        setStaking((prevStaking) => ({
      //          ...prevStaking,
      //          amount: "0",
      //          percentage: 0,
      //        }));
      //        setTransactionResult({
      //          status: true,
      //          action: "unstake",
      //          hash,
      //          stake: staking,
      //        });
      //      } catch (e) {
      //        setStaking((prevStaking) => ({
      //          ...prevStaking,
      //          amount: "0",
      //          percentage: 0,
      //        }));
      //        setTransactionResult({ status: false });
      //      } finally {
      //        setState((state) => ({ ...state, open: true }));
      //        setIsProcessingStake(false);
      //        dispatch(
      //          fetchFarmUsersThunk({
      //            connection,
      //            walletAddress: walletPubkey,
      //          }),
      //        );
      //      }
      //    }
    },
    [
      //connection,
      //walletPubkey,
      //config,
      //farmPool,
      //farmUser,
      //staking,
      //lpTokenConfig,
      //lpToken,
      //signTransaction,
      //position,
      //depositAmount,
      //dispatch,
    ],
  );

  const handleClaim = useCallback(
    async () => {
      // TODO(ypeng): Implement v2 transaction.
      //    if (!connection || !farmPool || !walletPubkey || !lpTokenConfig || !lpToken) {
      //      return null;
      //    }
      //
      //    const referrerPubkey = appState.referrerPublicKey;
      //    const enableReferral = appState.enableReferral;
      //
      //    setIsProcessingClaim(true);
      //    try {
      //      const transaction = await claim({
      //        connection,
      //        config,
      //        walletPubkey,
      //        farmPool,
      //        farmUser: farmUser.publicKey,
      //        claimDestination: rewardsAccount?.publicKey,
      //        referrer: referrerPubkey,
      //        enableReferral,
      //      });
      //      const signedTransaction = await signTransaction(transaction);
      //
      //      const hash = await sendSignedTransaction({
      //        signedTransaction,
      //        connection,
      //      });
      //
      //      await connection.confirmTransaction(hash, "confirmed");
      //      await fecthTokenAccountInfoList(
      //        [DELTAFI_TOKEN_MINT.toBase58()],
      //        walletPubkey,
      //        connection,
      //        dispatch,
      //      );
      //      setTransactionResult({
      //        status: true,
      //        action: "claim",
      //        hash,
      //      });
      //    } catch (e) {
      //      setTransactionResult({ status: false });
      //    } finally {
      //      setState((state) => ({ ...state, open: true }));
      //      setIsProcessingClaim(false);
      //      dispatch(
      //        fetchFarmUsersThunk({
      //          connection,
      //          walletAddress: walletPubkey,
      //        }),
      //      );
      //    }
    },
    [
      //    config,
      //    connection,
      //    farmPool,
      //    farmUser,
      //    lpTokenConfig,
      //    lpToken,
      //    signTransaction,
      //    walletPubkey,
      //    rewardsAccount,
      //    dispatch,
      //    appState,
    ],
  );

  const handleSnackBarClose = useCallback(() => {
    dispatch(stakeV2Actions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose, classes]);

  const snackMessasge = useMemo(() => {
    if (!stakeV2.transactionResult || !stakeV2.transactionResult.status) {
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

    const { hash, action, stake } = stakeV2.transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box>
          {stake && (
            <Typography variant="body1" color="primary">
              {`${action.charAt(0).toUpperCase() + action.slice(1)} ${Number(stake?.amount).toFixed(
                6,
              )} ${stake.token.symbol} LP`}
            </Typography>
          )}
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
  }, [stakeV2, classes, network]);

  if (!farmPool) return null;

  return (
    <Page>
      <Container className={classes.root}>
        <Box display="flex" justifyContent="space-between" pb={2}>
          <Typography variant="h6">{farmPool.name} LP Token Staking</Typography>
          <Box className={classes.iconGroup}>
            <img
              src={baseTokenInfo.logoURI}
              alt="staking-coin"
              className={clx(classes.coinIcon, classes.firstCoin)}
            />
            <img src={quoteTokenInfo.logoURI} alt="earning-coin" className={classes.coinIcon} />
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" pb={4}>
          <Box>
            <Typography>Total Staked {baseTokenInfo.symbol}</Typography>
            <Typography>{`${baseTotalStaked.toFixed(2).toString()}`}</Typography>
          </Box>
          <Box>
            <Typography>Pool Rate</Typography>
            <Typography>{basePoolRateByDay} DELFI / day</Typography>
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" pb={4}>
          <Box>
            <Typography>Total Staked {quoteTokenInfo.symbol}</Typography>
            <Typography>{`${quoteTotalStaked.toFixed(2).toString()}`}</Typography>
          </Box>
          <Box>
            <Typography>Pool Rate</Typography>
            <Typography>{quotePoolRateByDay} DELFI / day</Typography>
          </Box>
        </Box>

        {isConnectedWallet && (
          <Box className={classes.desc}>
            <Typography variant="h6" paragraph>
              About {farmPool.name} LP shares
            </Typography>
            <Typography variant="subtitle2">
              LP shares represents shares of the liquidity provided to a swap pool. You may obtain{" "}
              {poolConfig.name} LP shares by depositing {poolConfig.base} and {poolConfig.quote}{" "}
              into the {poolConfig.name} pool.
            </Typography>
            <Box display="flex" alignItems="center" mt={3}>
              <Link
                href={"/deposit/" + poolConfig?.swapInfo}
                target="_blank"
                rel="noreferrer noopener"
                underline="always"
                className={classes.link}
                data-amp-analytics-on="click"
                data-amp-analytics-name="click"
                data-amp-analytics-attrs="page: Farms, target: DELFI"
              >
                Deposit into the {poolConfig.name} Pool
                <LinkIcon className={classes.linkIcon} isDark width="15px" />
              </Link>
            </Box>
          </Box>
        )}

        <Box className={classes.liquidityStaked}>
          <Typography className={classes.title}>Your Liquidity Staked</Typography>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{userBaseStaked}</Typography>
            <Typography className={classes.amount}>{baseTokenInfo.symbol}</Typography>
          </Box>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{userQuoteStaked}</Typography>
            <Typography className={classes.amount}>{quoteTokenInfo.symbol}</Typography>
          </Box>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{rewardRateByDay} / Day</Typography>
            <Typography className={classes.amount}>DELFI</Typography>
          </Box>
        </Box>
        <Box className={classes.unclaimedToken}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography className={classes.title}>Your Unclaimed Token</Typography>
            {stakeV2.isProcessingClaim ? (
              <ConnectButton variant="contained" disabled={true}>
                <Avatar className={classes.claimLoadingButton} src={loadingIcon} />
              </ConnectButton>
            ) : (
              <ConnectButton
                variant="contained"
                onClick={handleClaim}
                disabled={!unclaimedReward.gt(0)}
                data-amp-analytics-on="click"
                data-amp-analytics-name="click"
                data-amp-analytics-attrs="page: Farms, target: Claim"
              >
                CLAIM
              </ConnectButton>
            )}
          </Box>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>
              {unclaimedReward.toFixed(DELTAFI_TOKEN_DECIMALS)}
            </Typography>
          </Box>
        </Box>
        <Paper className={classes.minting}>
          <Box className={classes.ratePanel}>
            <Typography color="primary" variant="body1" className={classes.marketCondition}>
              LIQUIDITY MINING
            </Typography>
            <div className={classes.divider} />
            <Box className={classes.tabs}>
              <Box>
                <MUIButton
                  className={staking.isStake ? classes.activeBtn : classes.btn}
                  onClick={() => handleSwitchMethod("stake")}
                >
                  Stake
                </MUIButton>
                &nbsp;
                <MUIButton
                  className={!staking.isStake ? classes.activeBtn : classes.btn}
                  onClick={() => handleSwitchMethod("unstake")}
                >
                  Unstake
                </MUIButton>
              </Box>
            </Box>
          </Box>
          <Box mb={1}>
            <Slider value={percentage} onChange={setStakePercentage} />
          </Box>

          {
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <StakeCard
                card={staking}
                handleChangeCard={setStakeAmount}
                tokens={tokenConfigs}
                disableDrop
                percentage={percentage < 0.02 ? 0 : percentage}
              />
            </Box>
          }
          <Box marginTop={2} width="100%">
            {stakeV2.isProcessingStake ? (
              <ConnectButton size="large" fullWidth variant="contained" disabled={true}>
                <Avatar className={classes.actionLoadingButton} src={loadingIcon} />
              </ConnectButton>
            ) : isConnectedWallet ? (
              <ConnectButton
                fullWidth
                size="large"
                variant="contained"
                onClick={handleStake}
                data-amp-analytics-on="click"
                data-amp-analytics-name="click"
                data-amp-analytics-attrs="page: Deposit, target: Deposit"
              >
                {staking.isStake ? "Stake" : "Unstake"}
              </ConnectButton>
            ) : (
              <ConnectButton size="large" fullWidth onClick={() => setMenu(true, "connect")}>
                Connect Wallet
              </ConnectButton>
            )}
          </Box>
        </Paper>
      </Container>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={stakeV2.openSnackbar}
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

export default Stake;
