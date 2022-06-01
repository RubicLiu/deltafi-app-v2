import { ReactElement, useMemo, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Snackbar,
  SnackbarContent,
  Box,
  Typography,
  IconButton,
  Link,
  Container,
  CircularProgress,
} from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import BigNumber from "bignumber.js";

import StakeCard from "views/Stake/components/Card";
import { ConnectButton } from "components";

import useStyles from "./style"
import { useModal } from "providers/modal";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { SOLSCAN_LINK, DELTAFI_TOKEN_DECIMALS, DELTAFI_TOKEN_MINT } from "constants/index";
import Slider from "./components/Slider";
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
import { anchorBnToBn, bnToString, stringToAnchorBn } from "utils/tokenUtils";

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
  const vertical = "bottom";
  const horizontal = "left";

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
            <Typography variant="body1" color="primary">
              {`Update the staking to
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
  }, [stakeView, classes, network, baseTokenInfo, quoteTokenInfo]);

  if (!farmPool) return null;

  const userBaseStakedString = bnToString(baseTokenInfo, userBaseStaked);
  const userQuoteStakedString = bnToString(quoteTokenInfo, userQuoteStaked);

  return (
    <Box>
      <Container className={classes.root}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h5">Stake</Typography>
          <IconButton size="small" onClick={() => setMenu(false, "")}>
            <CloseIcon />
          </IconButton>
        </Box>
        {/* <Box display="flex" justifyContent="space-between" pb={2}>
          <Typography variant="h6">{poolConfig.name} LP Token Staking</Typography>
          <Box className={classes.iconGroup}>
            <img
              src={baseTokenInfo.logoURI}
              alt="staking-coin"
              className={clx(classes.coinIcon, classes.firstCoin)}
            />
            <img src={quoteTokenInfo.logoURI} alt="earning-coin" className={classes.coinIcon} />
          </Box>
        </Box> */}
        <Box display="flex" justifyContent="space-between" mt={4} pb={4}>
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
        <Box>
          <Typography className={classes.title}>Your Liquidity Staked</Typography>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{userBaseStakedString}</Typography>
            <Typography className={classes.amount}>{baseTokenInfo.symbol}</Typography>
          </Box>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{userQuoteStakedString}</Typography>
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
            {stakeView.isProcessingClaim ? (
              <ConnectButton variant="contained" disabled={true}>
                <CircularProgress color="inherit" />
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
        <Box className={classes.ratePanel}>
          <Typography color="primary" variant="body1" className={classes.marketCondition}>
            LIQUIDITY MINING
          </Typography>
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
              {"Update Stake"}
            </ConnectButton>
          ) : (
            <ConnectButton size="large" fullWidth onClick={() => setMenu(true, "connect")}>
              Connect Wallet
            </ConnectButton>
          )}
        </Box>
        <Box display="flex" justifyContent="center" mt={3}>
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
          </Link>
        </Box>
      </Container>
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
