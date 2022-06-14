import { ReactElement, useMemo, useCallback } from "react";
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
import { SOLSCAN_LINK, DELTAFI_TOKEN_DECIMALS } from "constants/index";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLpUserBySwapKey,
  selectFarmByFarmKey,
  stakeViewSelector,
  selectSwapBySwapKey,
  // selectTokenAccountInfoByMint,
  selectMarketPriceByPool,
  programSelector,
  selectFarmUserByFarmKey,
} from "states/selectors";
import { deployConfigV2, getPoolConfigByFarmKey } from "constants/deployConfigV2";
import { tokenConfigs } from "constants/deployConfigV2";
import { stakeViewActions } from "states/views/stakeView";
import { createUpdateStakeTransaction } from "utils/transactions/stake";
import { sendSignedTransaction } from "utils/transactions";
import { fetchLiquidityProvidersThunk } from "states/accounts/liqudityProviderAccount";
import { anchorBnToBn, bnToAnchorBn, stringToAnchorBn } from "utils/tokenUtils";
import { fetchFarmUsersThunk } from "states/accounts/farmUserAccount";
import { Button, Divider, Link } from "@mui/material";
import Slider from "./components/Slider";
import { calculateWithdrawalFromShares } from "lib/calc";
import { formatCurrencyAmount } from "utils/utils";

const Stake = (): ReactElement => {
  const classes = useStyles();
  const { setMenu, data } = useModal();
  const farmPoolId = data.farmInfo;
  const farmPool = useSelector(selectFarmByFarmKey(farmPoolId));
  const poolConfig = getPoolConfigByFarmKey(farmPoolId);

  const baseTokenInfo = poolConfig.baseTokenInfo;
  const quoteTokenInfo = poolConfig.quoteTokenInfo;

  const lpUser = useSelector(selectLpUserBySwapKey(poolConfig.swapInfo));
  const farmUser = useSelector(selectFarmUserByFarmKey(farmPoolId));
  const swapInfo = useSelector(selectSwapBySwapKey(poolConfig.swapInfo));
  const program = useSelector(programSelector);
  const { basePrice, quotePrice } = useSelector(selectMarketPriceByPool(poolConfig));

  const wallet = useWallet();
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = wallet;
  const network = deployConfigV2.network;

  // const rewardsAccount = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));

  const dispatch = useDispatch();
  const stakeView = useSelector(stakeViewSelector);
  const vertical = "top";
  const horizontal = "right";

  const { baseStaked, quoteStaked, baseTotalAvailable, quoteTotalAvailable } = useMemo(() => {
    if (!lpUser) {
      return {
        baseStaked: new BigNumber(0),
        quoteStaked: new BigNumber(0),
        baseTotalAvailable: new BigNumber(0),
        quoteTotalAvailable: new BigNumber(0),
      };
    }

    let baseTotalAvailable = anchorBnToBn(
      baseTokenInfo,
      lpUser?.baseShare.sub(lpUser?.stakedBaseShare),
    );
    let quoteTotalAvailable = anchorBnToBn(
      quoteTokenInfo,
      lpUser?.quoteShare.sub(lpUser?.stakedQuoteShare),
    );

    if (farmUser?.basePosition && farmUser?.quotePosition) {
      const baseStaked = anchorBnToBn(baseTokenInfo, farmUser?.basePosition?.depositedAmount);
      const quoteStaked = anchorBnToBn(quoteTokenInfo, farmUser?.quotePosition?.depositedAmount);
      baseTotalAvailable = baseTotalAvailable.plus(baseStaked);
      quoteTotalAvailable = quoteTotalAvailable.plus(quoteStaked);
      return {
        baseStaked,
        quoteStaked,
        baseTotalAvailable,
        quoteTotalAvailable,
      };
    }

    return {
      baseStaked: new BigNumber(0),
      quoteStaked: new BigNumber(0),
      baseTotalAvailable,
      quoteTotalAvailable,
    };
  }, [lpUser, farmUser, baseTokenInfo, quoteTokenInfo]);

  const stakeCard = useMemo(() => {
    const { baseWithdrawalAmount: baseStakedAmount, quoteWithdrawalAmount: quoteStakedAmount } =
      calculateWithdrawalFromShares(
        bnToAnchorBn(baseTokenInfo, baseStaked),
        bnToAnchorBn(quoteTokenInfo, quoteStaked),
        baseTokenInfo,
        quoteTokenInfo,
        basePrice,
        quotePrice,
        swapInfo.poolState,
      );

    const { baseWithdrawalAmount: baseTotalAmount, quoteWithdrawalAmount: quoteTotalAmount } =
      calculateWithdrawalFromShares(
        bnToAnchorBn(baseTokenInfo, baseTotalAvailable),
        bnToAnchorBn(quoteTokenInfo, quoteTotalAvailable),
        baseTokenInfo,
        quoteTokenInfo,
        basePrice,
        quotePrice,
        swapInfo.poolState,
      );

    const { baseWithdrawalAmount: baseSelectedAmount, quoteWithdrawalAmount: quoteSelectedAmount } =
      calculateWithdrawalFromShares(
        bnToAnchorBn(baseTokenInfo, stakeView.stake.baseSelected),
        bnToAnchorBn(quoteTokenInfo, stakeView.stake.quoteSelected),
        baseTokenInfo,
        quoteTokenInfo,
        basePrice,
        quotePrice,
        swapInfo.poolState,
      );

    return {
      baseStakedAmount,
      quoteStakedAmount,
      baseTotalAmount,
      quoteTotalAmount,
      baseSelectedAmount,
      quoteSelectedAmount,
    };
  }, [
    stakeView.stake,
    swapInfo.poolState,
    baseTokenInfo,
    quoteTokenInfo,
    baseStaked,
    quoteStaked,
    baseTotalAvailable,
    quoteTotalAvailable,
    basePrice,
    quotePrice,
  ]);

  const staking = stakeView.stake;

  const handleStake = useCallback(async () => {
    if (!walletPubkey || !lpUser || !program) {
      return null;
    }

    const connection = program.provider.connection;
    try {
      dispatch(stakeViewActions.setIsProcessingStake({ isProcessingStake: true }));
      const baseAmount = stringToAnchorBn(
        poolConfig.baseTokenInfo,
        staking.baseSelected.toString(),
      );
      const quoteAmount = stringToAnchorBn(
        poolConfig.quoteTokenInfo,
        staking.quoteSelected.toString(),
      );
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
            hash,
            percentage: stakeView.stake.percentage,
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
          baseSelected: new BigNumber(0),
          quoteSelected: new BigNumber(0),
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
    stakeCard,
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

  // useEffect(() => {
  //   if (poolConfig) {
  //     dispatch(
  //       stakeViewActions.setBalance({
  //         baseShare: userTotalBase,
  //         quoteShare: userTotalQuote,
  //         baseStaked: userBaseStaked,
  //         quoteStaked: userQuoteStaked,
  //       }),
  //     );
  //   }
  // }, [dispatch, poolConfig, userBaseStaked, userQuoteStaked, userTotalBase, userTotalQuote]);

  const setStakePercentage = useCallback(
    (percentage: number) => {
      const baseSelected = new BigNumber(
        baseTotalAvailable
          .multipliedBy(new BigNumber(percentage))
          .dividedBy(new BigNumber(100))
          .toFixed(poolConfig.baseTokenInfo.decimals),
      );
      const quoteSelected = new BigNumber(
        quoteTotalAvailable
          .multipliedBy(new BigNumber(percentage))
          .dividedBy(new BigNumber(100))
          .toFixed(poolConfig.quoteTokenInfo.decimals),
      );
      dispatch(
        stakeViewActions.setPercentage({
          percentage,
          baseSelected,
          quoteSelected,
        }),
      );
    },
    [dispatch, poolConfig, baseTotalAvailable, quoteTotalAvailable],
  );

  const setStakeAmount = useCallback((value: string) => {}, []);

  const dailyReward = useMemo(() => {
    if (farmPool && baseStaked && quoteStaked) {
      const baseApr = new BigNumber(farmPool?.farmConfig.baseAprNumerator.toString()).div(
        new BigNumber(farmPool?.farmConfig.baseAprDenominator.toString()),
      );
      const quoteApr = new BigNumber(farmPool?.farmConfig.quoteAprNumerator.toString()).div(
        new BigNumber(farmPool?.farmConfig.quoteAprDenominator.toString()),
      );

      const baseDailyReward = baseStaked.multipliedBy(baseApr).dividedBy(365);
      const quoteDailyReward = quoteStaked.multipliedBy(quoteApr).dividedBy(365);

      return baseDailyReward.plus(quoteDailyReward).toFixed(DELTAFI_TOKEN_DECIMALS);
    }
    return "--";
  }, [farmPool, baseStaked, quoteStaked]);

  const totalStakedValue = useMemo(() => {
    const baseValue: BigNumber = new BigNumber(stakeCard.baseStakedAmount).multipliedBy(basePrice);
    const quoteValue: BigNumber = new BigNumber(stakeCard.quoteStakedAmount).multipliedBy(
      quotePrice,
    );
    return baseValue.plus(quoteValue);
  }, [basePrice, quotePrice, stakeCard]);

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

    const { hash, percentage } = stakeView.transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box>
          {percentage && (
            <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
              {`Update the staking to
              ${percentage}% of total shares`}
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
      <Box
        lineHeight={1}
        fontWeight={500}
        display="flex"
        justifyContent="space-between"
        mt={3}
        pb={3}
      >
        <Box>
          <Box fontSize={14} color="#D3D3D3">
            Total Staked
          </Box>
          <Box fontSize={16} mt={1}>
            {formatCurrencyAmount(totalStakedValue)}
          </Box>
        </Box>
        <Box>
          <Box textAlign="right" fontSize={14} color="#D3D3D3">
            Pool Rate
          </Box>
          <Box fontSize={16} mt={1}>
            {dailyReward} DELFI / day
          </Box>
        </Box>
      </Box>
      <Divider
        sx={{
          backgroundColor: "#fff",
          opacity: 0.4,
        }}
      />

      <Box className={classes.tabs} position="relative">
        <Box>
          <Button
            className={classes.activeBtn}
            sx={{
              fontWeight: 500,
              fontSize: 16,
              fontFamily: "Rubik",
              padding: 0,
              minWidth: 0,
              lineHeight: 1,
              textTransform: "none",
            }}
          >
            Stake
          </Button>
        </Box>
      </Box>
      <Slider value={staking.percentage} onChange={setStakePercentage} />
      <Box mt={3} display="flex" flexDirection="column" alignItems="flex-end">
        <StakeCard
          poolConfig={poolConfig}
          card={stakeCard}
          handleChangeCard={setStakeAmount}
          tokens={tokenConfigs}
          disableDrop
          percentage={staking.percentage < 0.02 ? 0 : staking.percentage}
        />
      </Box>
      <Box marginTop={3} width="100%">
        {stakeView.isProcessingStake ? (
          <ConnectButton size="large" fullWidth variant="contained" disabled={true}>
            <CircularProgress size={50} color="inherit" />
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
            Update Staking
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
