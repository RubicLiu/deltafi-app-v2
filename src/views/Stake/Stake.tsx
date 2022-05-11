import { ReactElement, useMemo, useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Snackbar,
  SnackbarContent,
  Box,
  Typography,
  IconButton,
  Link,
  Avatar,
  Modal,
  Divider,
  Button as MUIButton,
} from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import BigNumber from "bignumber.js";

import StakeCard from "views/Stake/components/Card";
import { ConnectButton } from "components";

import useStyles from "./styles";
import { useModal } from "providers/modal";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK, DELTAFI_TOKEN_DECIMALS, DELTAFI_TOKEN_MINT } from "constants/index";
import Slider from "./components/Slider";
import loadingIcon from "components/gif/loading_white.gif";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLpUserBySwapKey,
  selectFarmByFarmKey,
  stakeViewSelector,
  selectTokenAccountInfoByMint,
  programSelector,
} from "states/selectors";
import { deployConfigV2, getPoolConfigByFarmKey } from "constants/deployConfigV2";
import { tokenConfigs } from "constants/deployConfigV2";
import { stakeViewActions } from "states/views/stakeView";
import {
  createClaimFarmRewardsTransaction,
  createUpdateStakeTransaction,
} from "utils/transactions/stake";
import { sendSignedTransaction } from "utils/transactions";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { fecthTokenAccountInfoList } from "states/accounts/tokenAccount";
import { anchorBnToBn, stringToAnchorBn } from "utils/tokenUtils";
import StakePanel from "components/BurgerMenu/StakePanel";

// const SECONDS_OF_YEAR = 31556926;

// const getUnclaimedReward = (
//   apr: BigNumber,
//   lastUpdateTs: BigNumber,
//   nextClaimTs: BigNumber,
//   rewardsOwed: BigNumber,
//   depositBalance: BigNumber,
//   deltafiTokenDecimals: number,
// ) => {
//   const currentTs: BigNumber = new BigNumber(Date.now()).div(new BigNumber(1000));
//   if (currentTs <= nextClaimTs) {
//     return new BigNumber(0);
//   }
//   const unTrackedReward: BigNumber = currentTs
//     .minus(lastUpdateTs)
//     .div(new BigNumber(SECONDS_OF_YEAR))
//     .multipliedBy(depositBalance)
//     .multipliedBy(apr);

//   return exponentiatedBy(unTrackedReward.plus(rewardsOwed), deltafiTokenDecimals);
// };

const Stake = (): ReactElement => {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isStaking, setIsStaking] = useState(true);
  const classes = useStyles();
  const { data, setMenu } = useModal();
  const farmPoolId = data.farmInfo;
  const farmPool = useSelector(selectFarmByFarmKey(farmPoolId));
  const poolConfig = getPoolConfigByFarmKey(farmPoolId);
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

  // const baseTotalStaked = useMemo(() => {
  //   return farmPool
  //     ? anchorBnToBn(poolConfig.baseTokenInfo, farmPool.stakedBaseShare)
  //     : new BigNumber(0);
  // }, [farmPool, poolConfig]);

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

  const [userBaseStaked, userQuoteStaked, userTotalBase, userTotalQuote] = useMemo(() => {
    if (lpUser) {
      const baseTokenInfo = poolConfig.baseTokenInfo;
      const quoteTokenInfo = poolConfig.quoteTokenInfo;
      return [
        anchorBnToBn(baseTokenInfo, lpUser.basePosition.depositedAmount),
        anchorBnToBn(quoteTokenInfo, lpUser.quotePosition.depositedAmount),
        anchorBnToBn(baseTokenInfo, lpUser.baseShare.add(lpUser.basePosition.depositedAmount)),
        anchorBnToBn(quoteTokenInfo, lpUser.quoteShare.add(lpUser.quotePosition.depositedAmount)),
      ];
    }
    return [new BigNumber(0), new BigNumber(0), new BigNumber(0), new BigNumber(0)];
  }, [lpUser, poolConfig]);

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

  const staking = stakeView.stake;

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

  // const unclaimedReward = (() => {
  //   if (lpUser) {
  //     const baseReward = getUnclaimedReward(
  //       baseApr,
  //       lpUser.basePosition.lastUpdateTs,
  //       lpUser.basePosition.nextClaimTs,
  //       lpUser.basePosition.rewardsOwed,
  //       lpUser.basePosition.depositedAmount,
  //       DELTAFI_TOKEN_DECIMALS,
  //     );
  //     const quoteReward = getUnclaimedReward(
  //       quoteApr,
  //       lpUser.quotePosition.lastUpdateTs,
  //       lpUser.quotePosition.nextClaimTs,
  //       lpUser.quotePosition.rewardsOwed,
  //       lpUser.quotePosition.depositedAmount,
  //       DELTAFI_TOKEN_DECIMALS,
  //     );
  //     return baseReward.plus(quoteReward);
  //   }
  //   return new BigNumber(0);
  // })();

  // const basePoolRateByDay = useMemo(() => {
  //   if (farmPool && baseTotalStaked && baseTokenInfo) {
  //     return exponentiatedBy(
  //       exponentiate(baseTotalStaked.multipliedBy(baseApr).dividedBy(365), baseTokenInfo.decimals),
  //       DELTAFI_TOKEN_DECIMALS,
  //     ).toFixed(6);
  //   }
  //   return "--";
  // }, [farmPool, baseTokenInfo, baseApr, baseTotalStaked]);

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
        exponentiate(userBaseStaked.multipliedBy(baseApr).dividedBy(365), baseTokenInfo.decimals),
        DELTAFI_TOKEN_DECIMALS,
      );
      const quoteRate = exponentiatedBy(
        exponentiate(
          userQuoteStaked.multipliedBy(quoteApr).dividedBy(365),
          quoteTokenInfo.decimals,
        ),
        DELTAFI_TOKEN_DECIMALS,
      );
      return baseRate.plus(quoteRate).toFixed(6);
    }
    return "0";
  }, [userBaseStaked, userQuoteStaked, baseApr, quoteApr, lpUser, baseTokenInfo, quoteTokenInfo]);

  const handleStake = useCallback(async () => {
    if (!walletPubkey || !lpUser || !program) {
      return null;
    }

    const connection = program.provider.connection;
    dispatch(stakeViewActions.setIsProcessingStake({ isProcessingStake: true }));
    try {
      const baseAmount = stringToAnchorBn(poolConfig.baseTokenInfo, staking.baseAmount);
      const quoteAmount = stringToAnchorBn(poolConfig.quoteTokenInfo, staking.quoteAmount);
      const transaction = await createUpdateStakeTransaction(
        program,
        connection,
        poolConfig,
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
      dispatch(fetchLiquidityProvidersThunk({ connection, walletAddress: walletPubkey }));
    }
  }, [walletPubkey, staking, signTransaction, dispatch, poolConfig, lpUser, program]);

  const handleClaim = useCallback(async () => {
    if (!walletPubkey || !lpUser || !rewardsAccount || !program) {
      return null;
    }

    const connection = program.provider.connection;
    try {
      dispatch(stakeViewActions.setIsProcessingClaim({ isProcessingClaim: true }));
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
        stakeViewActions.setTransactionResult({
          transactionResult: {
            status: true,
            action: "claim",
            hash,
          },
        }),
      );
    } catch (e) {
      dispatch(stakeViewActions.setTransactionResult({ transactionResult: { status: false } }));
    } finally {
      dispatch(stakeViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(stakeViewActions.setIsProcessingClaim({ isProcessingClaim: false }));
      dispatch(fetchLiquidityProvidersThunk({ connection, walletAddress: walletPubkey }));
    }
  }, [walletPubkey, signTransaction, dispatch, poolConfig, lpUser, rewardsAccount, program]);

  const handleSnackBarClose = useCallback(() => {
    dispatch(stakeViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose]);

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
              failed to send transaction: Transaction simulation failed: Blockhash not found
            </Box>
          </Box>
        </Box>
      );
    }

    const { hash, stake } = stakeView.transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h5">Deposit</Typography>
          <IconButton size="small" onClick={() => setMenu(false, "")}>
            <CloseIcon />
          </IconButton>
        </Box>
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
          {stake && <Box>{`${Number(stake?.amount).toFixed(6)} ${stake.token.symbol} LP`}</Box>}
          <Box display="flex" alignItems="center">
            <Box>View Transaction:</Box>
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
  }, [stakeView.transactionResult, classes, network, setMenu]);

  if (!farmPool) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" pb={2}>
        <Typography variant="h6">Deposit</Typography>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box display="flex" justifyContent="space-between" pb={4}>
        <Box>
          <Typography className={classes.label}>Total Staked</Typography>
          <Typography className={classes.value}>{`${staking.baseStaked
            .plus(staking.quoteStaked)
            .toFixed(2)
            .toString()} ${farmPool.name}`}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography className={classes.label}>Pool Rate</Typography>
          <Typography className={classes.value}>{rewardRateByDay} DELFI / day</Typography>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" pb={4}>
        <Box>
          <Typography className={classes.label}>{quoteTokenInfo.symbol} Staked</Typography>
          <Typography className={classes.value}>{`${stakeView.stake.quoteStaked
            .toFixed(2)
            .toString()} ${farmPool.name}`}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography className={classes.label}>Pool Rate</Typography>
          <Typography className={classes.value}>{quotePoolRateByDay} DELFI / day</Typography>
        </Box>
      </Box>
      <Divider />
      <Box className={classes.ratePanel}>
        <Box className={classes.tabs}>
          <Box>
            <MUIButton
              className={isStaking ? classes.activeBtn : classes.btn}
              onClick={() => setIsStaking(true)}
            >
              Stake
            </MUIButton>
            <MUIButton
              className={!isStaking ? classes.activeBtn : classes.btn}
              onClick={() => setIsStaking(false)}
            >
              Unstake
            </MUIButton>
          </Box>
        </Box>
      </Box>
      {isStaking || (
        <Box mb={3}>
          <Slider value={percentage} onChange={setStakePercentage} />
        </Box>
      )}
      <Box display="flex" flexDirection="column" alignItems="flex-end">
        <StakeCard
          card={staking}
          handleChangeCard={setStakeAmount}
          tokens={tokenConfigs}
          disableDrop
          percentage={percentage < 0.02 ? 0 : percentage}
          poolConfig={poolConfig}
        />
      </Box>
      <Box marginTop={3} width="100%">
        {stakeView.isProcessingStake ? (
          <ConnectButton size="large" fullWidth variant="contained" disabled={true}>
            <Avatar className={classes.actionLoadingButton} src={loadingIcon} />
          </ConnectButton>
        ) : isConnectedWallet ? (
          <ConnectButton
            fullWidth
            size="large"
            variant="contained"
            onClick={() => setOpenConfirm(true)}
            data-amp-analytics-on="click"
            data-amp-analytics-name="click"
            data-amp-analytics-attrs="page: Deposit, target: Deposit"
          >
            {isStaking ? "Stake" : "Unstake"}
          </ConnectButton>
        ) : (
          <ConnectButton size="large" fullWidth onClick={() => setMenu(true, "connect")}>
            Connect Wallet
          </ConnectButton>
        )}
      </Box>
      <Box fontSize={12} fontWeight={500} textAlign="center" mt={3}>
        <Link href="#" underline="always">
          About DeltaFi LT Tokens
        </Link>
      </Box>
      <Box>
        <Modal className={classes.modalContainer} open={openConfirm}>
          <StakePanel
            address={farmPoolId}
            onClose={() => setOpenConfirm(false)}
            onConfirm={isStaking ? handleStake : handleClaim}
          />
        </Modal>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={stakeView.openSnackbar}
        onClose={handleSnackBarClose}
        key="stakeSnack"
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
