import { ReactElement, useMemo, useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Snackbar,
  SnackbarContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import BigNumber from "bignumber.js";

import StakeCard from "views/Stake/components/Card_v2";
import { ConnectButton } from "components";

import useStyles from "./styles";
import { useModal } from "providers/modal";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK, DELTAFI_TOKEN_DECIMALS } from "constants/index";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLpUserBySwapKey,
  selectFarmByFarmKey,
  stakeViewSelector,
  selectTokenAccountInfoByMint,
  programSelector,
  selectFarmUserByFarmKey,
  selectMarketPriceByPool,
  selectSwapBySwapKey,
} from "states/selectors";
import { deployConfigV2, getPoolConfigByFarmKey } from "constants/deployConfigV2";
import { tokenConfigs } from "constants/deployConfigV2";
import { stakeViewActions } from "states/views/stakeView";
import { createUpdateStakeTransaction } from "utils/transactions/stake";
import { sendSignedTransaction } from "utils/transactions";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { anchorBnToBn, stringToAnchorBn } from "utils/tokenUtils";
import { getTokenTvl, getUserTokenTvl } from "utils/utils";
import { fetchFarmUsersThunk } from "states/accounts/farmUserAccount";
import { Button, Divider, Link } from "@mui/material";
import Slider from "./components/Slider";

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
  const { setMenu, data } = useModal();
  const farmPoolId = data.farmInfo;
  const farmPool = useSelector(selectFarmByFarmKey(farmPoolId));
  const poolConfig = getPoolConfigByFarmKey(farmPoolId);
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig?.swapInfo));

  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;

  const lpUser = useSelector(selectLpUserBySwapKey(poolConfig.swapInfo));
  const program = useSelector(programSelector);

  const wallet = useWallet();
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = wallet;
  const network = deployConfigV2.network;

  const rewardsAccount = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));

  const dispatch = useDispatch();
  const stakeView = useSelector(stakeViewSelector);
  const vertical = "top";
  const horizontal = "right";

  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

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

  const stakedTvl = useMemo(() => {
    if (swapInfo && farmPool) {
      const userBaseTvl = getUserTokenTvl(
        baseTvl,
        farmPool.stakedBaseShare,
        swapInfo.poolState.baseSupply,
      );
      const userQuoteTvl = getUserTokenTvl(
        quoteTvl,
        farmPool.stakedQuoteShare,
        swapInfo.poolState.quoteSupply,
      );
      return userBaseTvl.plus(userQuoteTvl);
    }
    return 0;
  }, [swapInfo, farmPool, baseTvl, quoteTvl]);

  const baseTotalStaked = useMemo(() => {
    return farmPool
      ? anchorBnToBn(poolConfig.baseTokenInfo, farmPool.stakedBaseShare)
      : new BigNumber(0);
  }, [farmPool, poolConfig]);

  const quoteTotalStaked = useMemo(() => {
    return farmPool
      ? anchorBnToBn(poolConfig.quoteTokenInfo, farmPool.stakedQuoteShare)
      : new BigNumber(0);
  }, [farmPool, poolConfig]);

  const baseApr = new BigNumber(farmPool?.farmConfig.baseAprNumerator.toString()).div(
    new BigNumber(farmPool?.farmConfig.baseAprDenominator.toString()),
  );

  const quoteApr = new BigNumber(farmPool?.farmConfig.quoteAprNumerator.toString()).div(
    new BigNumber(farmPool?.farmConfig.quoteAprDenominator.toString()),
  );

  const farmUser = useSelector(selectFarmUserByFarmKey(farmPoolId));

  const [userBaseStaked, userQuoteStaked] = useMemo(() => {
    if (farmUser) {
      const baseTokenInfo = poolConfig.baseTokenInfo;
      const quoteTokenInfo = poolConfig.quoteTokenInfo;
      return [
        anchorBnToBn(baseTokenInfo, farmUser.basePosition.depositedAmount),
        anchorBnToBn(quoteTokenInfo, farmUser.quotePosition.depositedAmount),
      ];
    }
    return [new BigNumber(0), new BigNumber(0)];
  }, [farmUser, poolConfig]);

  const [userTotalBase, userTotalQuote] = useMemo(() => {
    if (lpUser) {
      const baseTokenInfo = poolConfig.baseTokenInfo;
      const quoteTokenInfo = poolConfig.quoteTokenInfo;
      return [
        anchorBnToBn(baseTokenInfo, lpUser.baseShare.add(lpUser.stakedBaseShare)),
        anchorBnToBn(quoteTokenInfo, lpUser.quoteShare.add(lpUser.stakedQuoteShare)),
      ];
    }
    return [new BigNumber(0), new BigNumber(0)];
  }, [lpUser, poolConfig]);

  const staking = stakeView.stake;

  const handleStake = useCallback(async () => {
    if (!walletPubkey || !lpUser || !program) {
      return null;
    }

    const connection = program.provider.connection;
    try {
      dispatch(stakeViewActions.setIsProcessingStake({ isProcessingStake: true }));
      const baseAmount = stringToAnchorBn(poolConfig.baseTokenInfo, staking.baseAmount);
      const quoteAmount = stringToAnchorBn(poolConfig.quoteTokenInfo, staking.quoteAmount);
      const transaction = await createUpdateStakeTransaction(
        program,
        connection,
        poolConfig,
        farmPoolId,
        walletPubkey,
        farmUser,
        baseAmount,
        quoteAmount,
      );

      const signedTransaction = await signTransaction(transaction);
      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });
      await connection.confirmTransaction(hash, "confirmed");

      dispatch(
        stakeViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            action: "stake",
            hash,
            stake: staking,
          },
        }),
      );
    } catch (e) {
      console.error(e);
      dispatch(
        stakeViewActions.setTransactionResult({
          transactionResult: {
            status: false,
          },
        }),
      );
    } finally {
      dispatch(
        stakeViewActions.setPercentage({
          percentage: 0,
          baseAmount: "0",
          quoteAmount: "0",
        }),
      );
      dispatch(stakeViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(stakeViewActions.setIsProcessingStake({ isProcessingStake: false }));
      dispatch(fetchFarmUsersThunk({ connection, walletAddress: walletPubkey }));
      dispatch(fetchLiquidityProvidersThunk({ connection, walletAddress: walletPubkey }));
    }
  }, [
    walletPubkey,
    staking,
    signTransaction,
    dispatch,
    poolConfig,
    lpUser,
    program,
    farmPoolId,
    farmUser,
  ]);
  // const [userBaseStaked, userQuoteStaked, userTotalBase, userTotalQuote] = useMemo(() => {
  //   if (lpUser) {
  //     const baseTokenInfo = poolConfig.baseTokenInfo;
  //     const quoteTokenInfo = poolConfig.quoteTokenInfo;
  //     return [
  //       anchorBnToBn(baseTokenInfo, lpUser.basePosition.depositedAmount),
  //       anchorBnToBn(quoteTokenInfo, lpUser.quotePosition.depositedAmount),
  //       anchorBnToBn(baseTokenInfo, lpUser.baseShare.add(lpUser.basePosition.depositedAmount)),
  //       anchorBnToBn(quoteTokenInfo, lpUser.quoteShare.add(lpUser.quotePosition.depositedAmount)),
  //     ];
  //   }
  //   return [new BigNumber(0), new BigNumber(0), new BigNumber(0), new BigNumber(0)];
  // }, [lpUser, poolConfig]);

  useEffect(() => {
    if (poolConfig) {
      dispatch(
        stakeViewActions.setBalance({
          baseBalance: userTotalBase,
          quoteBalance: userTotalQuote,
          baseStaked: userBaseStaked,
          quoteStaked: userQuoteStaked,
        }),
      );
    }
  }, [dispatch, poolConfig, userBaseStaked, userQuoteStaked, userTotalBase, userTotalQuote]);

  const percentage = staking.percentage;
  const setStakePercentage = useCallback(
    (percentage: number) => {
      const baseAmount = staking.baseBalance
        .multipliedBy(new BigNumber(percentage))
        .dividedBy(new BigNumber(100))
        .toFixed(poolConfig.baseTokenInfo.decimals);
      const quoteAmount = staking.quoteBalance
        .multipliedBy(new BigNumber(percentage))
        .dividedBy(new BigNumber(100))
        .toFixed(poolConfig.quoteTokenInfo.decimals);
      dispatch(
        stakeViewActions.setPercentage({
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
    if (lpUser && farmUser) {
      const baseReward = getUnclaimedReward(
        baseApr,
        new BigNumber(farmUser.basePosition.lastUpdateTs.toString()),
        new BigNumber(farmUser.basePosition.nextClaimTs.toString()),
        new BigNumber(farmUser.basePosition.rewardsOwed.toString()),
        new BigNumber(farmUser.basePosition.depositedAmount.toString()),
        DELTAFI_TOKEN_DECIMALS,
      );
      const quoteReward = getUnclaimedReward(
        quoteApr,
        new BigNumber(farmUser.quotePosition.lastUpdateTs.toString()),
        new BigNumber(farmUser.quotePosition.nextClaimTs.toString()),
        new BigNumber(farmUser.quotePosition.rewardsOwed.toString()),
        new BigNumber(farmUser.quotePosition.depositedAmount.toString()),
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

  // const quotePoolRateByDay = useMemo(() => {
  //   if (farmPool && quoteTotalStaked && quoteTokenInfo) {
  //     return exponentiatedBy(
  //       exponentiate(
  //         quoteTotalStaked.multipliedBy(quoteApr).dividedBy(365),
  //         quoteTokenInfo.decimals,
  //       ),
  //       DELTAFI_TOKEN_DECIMALS,
  //     ).toFixed(6);
  //   }
  //   return "--";
  // }, [farmPool, quoteTokenInfo, quoteApr, quoteTotalStaked]);

  // const rewardRateByDay = useMemo(() => {
  //   if (lpUser && baseApr && quoteApr) {
  //     const baseRate = exponentiatedBy(
  //       exponentiate(userBaseStaked.multipliedBy(baseApr).dividedBy(365), baseTokenInfo.decimals),
  //       DELTAFI_TOKEN_DECIMALS,
  //     );
  //     const quoteRate = exponentiatedBy(
  //       exponentiate(
  //         userQuoteStaked.multipliedBy(quoteApr).dividedBy(365),
  //         quoteTokenInfo.decimals,
  //       ),
  //       DELTAFI_TOKEN_DECIMALS,
  //     );
  //     return baseRate.plus(quoteRate).toFixed(6);
  //   }
  //   return "0";
  // }, [userBaseStaked, userQuoteStaked, baseApr, quoteApr, lpUser, baseTokenInfo, quoteTokenInfo]);

  // const handleClaim = useCallback(async () => {
  //   if (!walletPubkey || !lpUser || !rewardsAccount || !program) {
  //     return null;
  //   }

  //   const connection = program.provider.connection;
  //   try {
  //     dispatch(stakeViewActions.setIsProcessingClaim({ isProcessingClaim: true }));
  //     const transaction = await createClaimFarmRewardsTransaction(
  //       program,
  //       connection,
  //       poolConfig,
  //       walletPubkey,
  //       rewardsAccount.publicKey,
  //     );
  //     const signedTransaction = await signTransaction(transaction);

  //     const hash = await sendSignedTransaction({
  //       signedTransaction,
  //       connection,
  //     });

  //     await connection.confirmTransaction(hash, "confirmed");
  //     await fecthTokenAccountInfoList(
  //       [DELTAFI_TOKEN_MINT.toBase58()],
  //       walletPubkey,
  //       connection,
  //       dispatch,
  //     );
  //     dispatch(
  //       stakeViewActions.setTransactionResult({
  //         transactionResult: {
  //           status: true,
  //           action: "claim",
  //           hash,
  //         },
  //       }),
  //     );
  //   } catch (e) {
  //     dispatch(stakeViewActions.setTransactionResult({ transactionResult: { status: false } }));
  //   } finally {
  //     dispatch(stakeViewActions.setOpenSnackbar({ openSnackbar: true }));
  //     dispatch(stakeViewActions.setIsProcessingClaim({ isProcessingClaim: false }));
  //     dispatch(fetchLiquidityProvidersThunk({ connection, walletAddress: walletPubkey }));
  //   }
  // }, [walletPubkey, signTransaction, dispatch, poolConfig, lpUser, rewardsAccount, program]);

  const handleSnackBarClose = useCallback(() => {
    dispatch(stakeViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose, classes]);

  const snackMessasge = useMemo(() => {
    if (!stakeView.transactionResult || !stakeView.transactionResult.status) {
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
              <Box>
                failed to send transaction: Transaction simulation failed: Blockhash not found
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }

    const { hash, stake } = stakeView.transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box>
          {stake && (
            <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
              {`Update the staking to
              ${Number(stake?.baseAmount).toFixed(baseTokenInfo.decimals)} ${baseTokenInfo.symbol}
              share and ${Number(stake?.quoteAmount).toFixed(quoteTokenInfo.decimals)}
              ${quoteTokenInfo.symbol} share`}
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
  }, [stakeView, classes, network, baseTokenInfo, quoteTokenInfo]);

  if (!farmPool) return null;

  return (
    <Box className={classes.root}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h5">Stake</Typography>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box lineHeight={1} display="flex" justifyContent="space-between" mt={3} pb={3}>
        <Box>
          <Box fontSize={14} fontWeight={500} color="#D3D3D3">
            Total Staked
          </Box>
          <Box fontSize={16} mt={1} fontWeight={400}>{`${baseTotalStaked
            .toFixed(2)
            .toString()}`}</Box>
        </Box>
        <Box>
          <Box textAlign="right" fontSize={14} fontWeight={500} color="#D3D3D3">
            Pool Rate
          </Box>
          <Box fontSize={16} mt={1} fontWeight={400}>
            {basePoolRateByDay} DELFI / day
          </Box>
        </Box>
      </Box>
      <Divider
        sx={{
          backgroundColor: "#fff",
          opacity: 0.6,
        }}
      />

      <Box className={classes.tabs} position="relative">
        <Box>
          <Button
            className={staking.isStake ? classes.activeBtn : classes.btn}
            onClick={() => dispatch(stakeViewActions.setIsStake({ isStake: true }))}
            sx={{
              fontWeight: 500,
              fontSize: 16,
              fontFamily: "Rubik",
              padding: 0,
              minWidth: 0,
              lineHeight: 1,
            }}
          >
            Stake
          </Button>
          <Button
            className={staking.isStake ? classes.btn : classes.activeBtn}
            onClick={() => dispatch(stakeViewActions.setIsStake({ isStake: false }))}
            sx={{
              marginLeft: 2,
              fontWeight: 500,
              fontSize: 16,
              fontFamily: "Rubik",
              padding: 0,
              lineHeight: 1,
            }}
          >
            Unstake
          </Button>
        </Box>
      </Box>
      {staking.isStake || <Slider value={percentage} onChange={setStakePercentage} />}
      <Box mt={3} display="flex" flexDirection="column" alignItems="flex-end">
        <StakeCard
          poolConfig={poolConfig}
          card={staking}
          handleChangeCard={setStakeAmount}
          tokens={tokenConfigs}
          disableDrop
          percentage={percentage < 0.02 ? 0 : percentage}
        />
      </Box>
      <Box marginTop={3} width="100%">
        {stakeView.isProcessingStake ? (
          <ConnectButton size="large" fullWidth variant="contained" disabled={true}>
            <CircularProgress color="inherit" />
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
            Stake
          </ConnectButton>
        ) : (
          <ConnectButton size="large" fullWidth onClick={() => setMenu(true, "connect")}>
            Connect Wallet
          </ConnectButton>
        )}
      </Box>
      <Box display="flex" justifyContent="center" mt={3}>
        <Link
          href="#"
          target="_blank"
          rel="noreferrer noopener"
          underline="always"
          data-amp-analytics-on="click"
          data-amp-analytics-name="click"
          data-amp-analytics-attrs="page: Farms, target: DELFI"
          sx={{ fontSize: 12, color: "#f6f6f6" }}
        >
          About DeltaFi LT Tokens
        </Link>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={stakeView.openSnackbar}
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

export default Stake;
