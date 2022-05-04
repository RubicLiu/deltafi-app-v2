import { ReactElement, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { SOLSCAN_LINK, DELTAFI_TOKEN_DECIMALS, DELTAFI_TOKEN_MINT } from "constants/index";
import { useCustomConnection } from "providers/connection";
import Slider from "./components/Slider";
import loadingIcon from "components/gif/loading_white.gif";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLpUserBySwapKey,
  selectFarmByFarmKey,
  stakeSelector,
  selectTokenAccountInfoByMint,
} from "states/v2/selectorsV2";
import { deployConfigV2, getPoolConfigByFarmKey } from "constants/deployConfigV2";
import { tokenConfigs } from "constants/deployConfig";
import { stakeV2Actions } from "states/v2/stakeV2State";
import {
  createClaimFarmRewardsTransaction,
  createStakeTransaction,
  createUnstakeTransaction,
} from "utils/transactions/v2/stake";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { sendSignedTransaction } from "utils/transactions";
import { fetchLiquidityProvidersV2Thunk } from "states/v2/liqudityProviderV2State";
import { fecthTokenAccountInfoList } from "states/v2/tokenV2State";

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

  const wallet = useWallet();
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = wallet;
  const { network } = useCustomConnection();
  const { connection } = useConnection();

  const rewardsAccount = useSelector(selectTokenAccountInfoByMint(DELTAFI_TOKEN_MINT.toBase58()));
  const { setMenu } = useModal();
  const dispatch = useDispatch();
  const stakeV2 = useSelector(stakeSelector);
  const vertical = "bottom";
  const horizontal = "left";

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

  useEffect(() => {
    if (poolConfig) {
      dispatch(
        stakeV2Actions.setIsStake({
          isStake: true,
          baseBalance: new BigNumber(userBaseShare),
          quoteBalance: new BigNumber(userQuoteShare),
        }),
      );
    }
  }, [dispatch, poolConfig, userBaseShare, userQuoteShare]);

  const staking = stakeV2.stake;

  const percentage = staking.percentage;
  const setStakePercentage = useCallback(
    (percentage: number) => {
      const baseAmount = staking.baseBalance
        .multipliedBy(new BigNumber(percentage))
        .dividedBy(new BigNumber(100))
        .dividedBy(10 ** poolConfig.baseTokenInfo.decimals)
        .toFixed(poolConfig.baseTokenInfo.decimals);
      const quoteAmount = staking.quoteBalance
        .multipliedBy(new BigNumber(percentage))
        .dividedBy(new BigNumber(100))
        .dividedBy(10 ** poolConfig.quoteTokenInfo.decimals)
        .toFixed(poolConfig.quoteTokenInfo.decimals);
      dispatch(
        stakeV2Actions.setPercentage({
          percentage,
          baseAmount,
          quoteAmount,
        }),
      );
    },
    [dispatch, staking, poolConfig],
  );

  const setStakeAmount = useCallback((value: string) => {}, []);

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
          new BigNumber(userBaseStaked)
            .dividedBy(10 ** baseTokenInfo.decimals)
            .multipliedBy(baseApr)
            .dividedBy(365),
          baseTokenInfo.decimals,
        ),
        DELTAFI_TOKEN_DECIMALS,
      );
      const quoteRate = exponentiatedBy(
        exponentiate(
          new BigNumber(userQuoteStaked)
            .dividedBy(10 ** quoteTokenInfo.decimals)
            .multipliedBy(quoteApr)
            .dividedBy(365),
          quoteTokenInfo.decimals,
        ),
        DELTAFI_TOKEN_DECIMALS,
      );
      return baseRate.plus(quoteRate).toFixed(6);
    }
    return "0";
  }, [userBaseStaked, userQuoteStaked, baseApr, quoteApr, lpUser, baseTokenInfo, quoteTokenInfo]);

  const handleSwitchMethod = useCallback(
    (method: "stake" | "unstake") => {
      const isStake = method === "stake";
      dispatch(
        stakeV2Actions.setIsStake({
          isStake,
          baseBalance: new BigNumber(isStake ? userBaseShare : userBaseStaked),
          quoteBalance: new BigNumber(isStake ? userQuoteShare : userQuoteStaked),
        }),
      );
    },
    [dispatch, userBaseShare, userQuoteShare, userBaseStaked, userQuoteStaked],
  );

  const handleStake = useCallback(async () => {
    if (!connection || !walletPubkey || !lpUser) {
      return null;
    }

    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(connection, wallet),
    );

    if (staking.isStake) {
      dispatch(stakeV2Actions.setIsProcessingStake({ isProcessingStake: true }));
      try {
        const baseAmount = new BigNumber(staking.baseAmount).multipliedBy(
          new BigNumber(10 ** poolConfig.baseTokenInfo.decimals),
        );
        const quoteAmount = new BigNumber(staking.quoteAmount).multipliedBy(
          new BigNumber(10 ** poolConfig.quoteTokenInfo.decimals),
        );
        const transaction = await createStakeTransaction(
          program,
          connection,
          poolConfig,
          walletPubkey,
          new BN(baseAmount.toFixed(0)),
          new BN(quoteAmount.toFixed(0)),
        );

        const signedTransaction = await signTransaction(transaction);
        const hash = await sendSignedTransaction({
          signedTransaction,
          connection,
        });

        await connection.confirmTransaction(hash, "confirmed");

        dispatch(
          stakeV2Actions.setTransactionResult({
            transactionResult: {
              status: true,
              action: "stake",
              hash,
              stake: staking,
            },
          }),
        );
      } catch (e) {
        dispatch(
          stakeV2Actions.setTransactionResult({
            transactionResult: {
              status: false,
            },
          }),
        );
      } finally {
        dispatch(
          stakeV2Actions.setPercentage({
            percentage: 0,
            baseAmount: "0",
            quoteAmount: "0",
          }),
        );
        dispatch(stakeV2Actions.setOpenSnackbar({ openSnackbar: true }));
        dispatch(stakeV2Actions.setIsProcessingStake({ isProcessingStake: false }));
        dispatch(fetchLiquidityProvidersV2Thunk({ connection, walletAddress: walletPubkey }));
      }
    } else {
      dispatch(stakeV2Actions.setIsProcessingStake({ isProcessingStake: true }));
      try {
        const baseAmount = new BigNumber(staking.baseAmount).multipliedBy(
          new BigNumber(10 ** poolConfig.baseTokenInfo.decimals),
        );
        const quoteAmount = new BigNumber(staking.quoteAmount).multipliedBy(
          new BigNumber(10 ** poolConfig.quoteTokenInfo.decimals),
        );
        const transaction = await createUnstakeTransaction(
          program,
          connection,
          poolConfig,
          walletPubkey,
          new BN(baseAmount.toFixed(0)),
          new BN(quoteAmount.toFixed(0)),
        );

        const signedTransaction = await signTransaction(transaction);
        const hash = await sendSignedTransaction({
          signedTransaction,
          connection,
        });

        await connection.confirmTransaction(hash, "confirmed");

        dispatch(
          stakeV2Actions.setTransactionResult({
            transactionResult: {
              status: true,
              action: "unstake",
              hash,
              stake: staking,
            },
          }),
        );
      } catch (e) {
        dispatch(
          stakeV2Actions.setTransactionResult({
            transactionResult: {
              status: false,
            },
          }),
        );
      } finally {
        dispatch(
          stakeV2Actions.setPercentage({
            percentage: 0,
            baseAmount: "0",
            quoteAmount: "0",
          }),
        );
        dispatch(stakeV2Actions.setOpenSnackbar({ openSnackbar: true }));
        dispatch(stakeV2Actions.setIsProcessingStake({ isProcessingStake: false }));
        dispatch(fetchLiquidityProvidersV2Thunk({ connection, walletAddress: walletPubkey }));
      }
    }
  }, [connection, walletPubkey, staking, signTransaction, dispatch, wallet, poolConfig, lpUser]);

  const handleClaim = useCallback(async () => {
    if (!connection || !walletPubkey || !lpUser) {
      return null;
    }

    dispatch(stakeV2Actions.setIsProcessingClaim({ isProcessingClaim: true }));
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(connection, wallet),
    );

    try {
      const transaction = await createClaimFarmRewardsTransaction(
        program,
        connection,
        poolConfig,
        walletPubkey,
        rewardsAccount.publicKey,
      );
      const signedTransaction = await signTransaction(transaction);

      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");
      await fecthTokenAccountInfoList(
        [DELTAFI_TOKEN_MINT.toBase58()],
        walletPubkey,
        connection,
        dispatch,
      );
      dispatch(
        stakeV2Actions.setTransactionResult({
          transactionResult: {
            status: true,
            action: "claim",
            hash,
          },
        }),
      );
    } catch (e) {
      dispatch(stakeV2Actions.setTransactionResult({ transactionResult: { status: false } }));
    } finally {
      dispatch(stakeV2Actions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(stakeV2Actions.setIsProcessingClaim({ isProcessingClaim: false }));
      dispatch(fetchLiquidityProvidersV2Thunk({ connection, walletAddress: walletPubkey }));
    }
  }, [connection, walletPubkey, signTransaction, dispatch, wallet, poolConfig, lpUser, rewardsAccount]);

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
              {`${action.charAt(0).toUpperCase() + action.slice(1)}
              ${Number(stake?.baseAmount).toFixed(baseTokenInfo.decimals)} ${baseTokenInfo.symbol}
              share and ${Number(stake?.quoteAmount).toFixed(quoteTokenInfo.decimals)}
              ${quoteTokenInfo.symbol} share`}
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
  }, [stakeV2, classes, network, baseTokenInfo, quoteTokenInfo]);

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
            <Typography className={classes.amount}>
              {new BigNumber(userBaseStaked)
                .dividedBy(10 ** baseTokenInfo.decimals)
                .toFixed(baseTokenInfo.decimals)}
            </Typography>
            <Typography className={classes.amount}>{baseTokenInfo.symbol}</Typography>
          </Box>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>
              {new BigNumber(userQuoteStaked)
                .dividedBy(10 ** quoteTokenInfo.decimals)
                .toFixed(quoteTokenInfo.decimals)}
            </Typography>
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
                poolConfig={poolConfig}
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
