import React, { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { makeStyles, Theme, Link, Divider, CircularProgress } from "@material-ui/core";
import { ConnectButton } from "components";
import { useModal } from "providers/modal";
import { ShareDiscord, ShareMedium, ShareTelegram, ShareTwitter } from "components";
import copy from "copy-to-clipboard";
import CloseIcon from "@mui/icons-material/Close";

import { sendSignedTransaction } from "utils/transactions";
import { useDispatch, useSelector } from "react-redux";
import {
  deltafiUserSelector,
  programSelector,
  rewardViewSelector,
  selectTokenAccountInfoByMint,
  farmUserSelector,
  farmSelector,
} from "states/selectors";
import { rewardViewActions } from "states/views/rewardView";
import {
  fetchDeltafiUserManually,
  fetchDeltafiUserThunk,
} from "states/accounts/deltafiUserAccount";
import {
  createClaimSwapRewardsTransaction,
  createDeltafiUserTransaction,
} from "utils/transactions/deltafiUser";
import { createClaimFarmRewardsTransaction } from "utils/transactions/stake";

import {
  BLOG_LINK,
  DELTAFI_TOKEN_DECIMALS,
  DISCORD_LINK,
  SECONDS_PER_YEAR,
  TELEGRAM_LINK,
  TWITTER_LINK,
} from "constants/index";
import BN from "bn.js";
import BigNumber from "bignumber.js";
import { exponentiatedBy } from "utils/decimal";
import { deployConfigV2, deployMode, PoolConfig, poolConfigs } from "constants/deployConfigV2";
import { Box, Button, IconButton, Snackbar, SnackbarContent } from "@mui/material";
import styled from "styled-components";
import { fetchFarmUsersThunk } from "states/accounts/farmUserAccount";
import { scheduleWithInterval } from "utils";

const useStyles = makeStyles(({ palette, breakpoints, spacing }: Theme) => ({
  root: {
    width: "100%",
    margin: "auto",
    lineHeight: 1,
  },
  defaultWrapper: {
    marginTop: 20,
    textAlign: "center",
    [breakpoints.down("sm")]: {
      maxWidth: 248,
      margin: "10px auto",
    },
  },
  snackBarContent: {
    maxWidth: 385,
    backgroundColor: palette.background.lightBlack,
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    flexDirection: "row",
  },
  fontBold: {
    fontWeight: "bold",
  },
  subContent: {
    color: "#F7F7F7",
  },
  subContentMargin2: {
    marginBottom: spacing(2),
  },
  referralTitle: {
    fontWeight: 500,
    fontSize: 28,
  },
  sharePanelRow: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  shareLabel: {
    marginRight: spacing(3),
    [breakpoints.down("sm")]: {
      marginRight: spacing(1.5),
    },
  },
  sharePannel: {
    backgroundColor: "#1D1A27",
    padding: "40px 50px 40px 50px",
    borderRadius: "1rem",
    [breakpoints.down("sm")]: {
      padding: "2rem 1rem",
    },
  },
  shareButton: {
    width: 29,
    height: 29,
    [breakpoints.down("sm")]: {
      width: 24,
      height: 24,
    },
  },
  socialLinks: {
    gap: spacing(3),
    [breakpoints.down("sm")]: {
      gap: spacing(1.5),
    },
  },
  inputLink: {
    border: "none",
    padding: "16px 40px",
    maxWidth: 512,
    color: "white",
    marginRight: "16px",
    background: "#1C1C1C",
    borderRadius: 20,
    flex: 1,
    outline: "none",
    fontFamily: "Rubik",
    minWidth: 512,
    [breakpoints.down("sm")]: {
      padding: "12px",
      marginRight: "8px",
      fontSize: "10px",
      minWidth: "auto",
    },
  },
  SettingUpAccountButton: {
    marginLeft: 45,
    marginRight: 45,
    width: 24,
    height: 24,
  },
  snackBarIcon: {
    marginRight: spacing(2),
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
  },
  verticalDiver: {
    background: "rgba(255, 255, 255, 0.3)",
    margin: "5px 40px",
  },
  rewardBox: {
    padding: 20,
    background: "#1C1C1C",
    borderRadius: 10,
    minWidth: 300,
    gap: 10,
    lineHeight: 1.5,
    justifyContent: "space-between",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    fontWeight: 500,
    fontSize: 14,
    "& .label": {
      fontSize: 20,
      fontWeight: 600,
    },
  },
}));

const StyledButton = styled(Button)`
  padding: 12px 24px;
  border-radius: 50px;
  min-width: 180px;
  &.Mui-disabled {
    color: inherit;
    border-color: inherit;
  }
`;

const Home: React.FC = (props) => {
  const classes = useStyles(props);
  const { setMenu } = useModal();
  const wallet = useWallet();
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = wallet;
  const dispatch = useDispatch();
  const program = useSelector(programSelector);

  const rewardView = useSelector(rewardViewSelector);
  const deltafiUser = useSelector(deltafiUserSelector);

  const farmPoolKeyToFarmUser = useSelector(farmUserSelector);
  const farmKeyToFarmInfo = useSelector(farmSelector);

  const userDeltafiToken = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));
  const referralLinkState = rewardView.referralLinkState;
  const referralLink = rewardView.referralLink;

  const getUntrackedReward = (
    currentTs: number,
    lastUpdateTs: number,
    nextClaimTs: number,
    apr: BigNumber,
    depositAmount: BigNumber,
  ) => {
    if (lastUpdateTs >= currentTs || currentTs <= nextClaimTs) {
      return new BigNumber(0);
    }
    return depositAmount
      .multipliedBy(apr)
      .multipliedBy(currentTs - lastUpdateTs)
      .dividedBy(SECONDS_PER_YEAR);
  };

  useEffect(() => {
    // Refresh the pyth data every 5 seconds.
    return scheduleWithInterval(() => dispatch(rewardViewActions.updateRefreshTs()), 5 * 1000);
  }, [dispatch]);

  // farmPoolToReward records user's rewards in each pool
  // userUnclaimedFarmRewards is user's unclaimed rewards up till now
  // userTotalFarmRewards is the rewards amount that have been claimed by the user
  const { farmPoolToRewards, userUnclaimedFarmRewards, userTotalFarmRewards } = useMemo(() => {
    const farmPoolToRewards: Record<
      string,
      { unclaimedFarmRewards: string; totalFarmRewards: string }
    > = {};

    let userUnclaimedFarmRewards = new BigNumber(0);
    let userTotalFarmRewards = new BigNumber(0);

    if (!farmKeyToFarmInfo || !farmPoolKeyToFarmUser) {
      return {
        farmPoolToRewards,
        userUnclaimedFarmRewards: "--",
        userTotalFarmRewards: "--",
      };
    }

    let hasFarmUser = false;
    for (const farmPoolKey in farmPoolKeyToFarmUser) {
      const farmUser = farmPoolKeyToFarmUser[farmPoolKey];
      const farmInfo = farmKeyToFarmInfo[farmPoolKey];
      if (!farmUser || !farmInfo) {
        farmPoolToRewards[farmPoolKey] = { unclaimedFarmRewards: "--", totalFarmRewards: "--" };
        continue;
      }
      hasFarmUser = true;

      const baseApr = new BigNumber(farmInfo.farmConfig.baseAprNumerator.toString()).dividedBy(
        farmInfo.farmConfig.baseAprDenominator.toString(),
      );
      const quoteApr = new BigNumber(farmInfo.farmConfig.quoteAprNumerator.toString()).dividedBy(
        farmInfo.farmConfig.quoteAprDenominator.toString(),
      );

      const owedBaseRewards = exponentiatedBy(
        farmUser.basePosition.rewardsOwed.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );
      const unTrackedBaseRewards = getUntrackedReward(
        rewardView.rewardRefreshTs,
        farmUser.basePosition.lastUpdateTs.toNumber(),
        farmUser.basePosition.nextClaimTs.toNumber(),
        baseApr,
        exponentiatedBy(farmUser.basePosition.depositedAmount.toString(), DELTAFI_TOKEN_DECIMALS),
      );
      const claimedBaseRewards = exponentiatedBy(
        farmUser.basePosition.cumulativeInterest.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );

      const owedQuoteRewards = exponentiatedBy(
        farmUser.quotePosition.rewardsOwed.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );
      const unTrackedQuoteRewards = getUntrackedReward(
        rewardView.rewardRefreshTs,
        farmUser.quotePosition.lastUpdateTs.toNumber(),
        farmUser.quotePosition.nextClaimTs.toNumber(),
        quoteApr,
        exponentiatedBy(farmUser.quotePosition.depositedAmount.toString(), DELTAFI_TOKEN_DECIMALS),
      );
      const claimedQuoteRewards = exponentiatedBy(
        farmUser.quotePosition.cumulativeInterest.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );

      const unclaimedFarmRewards = owedBaseRewards
        .plus(owedQuoteRewards)
        .plus(unTrackedBaseRewards)
        .plus(unTrackedQuoteRewards)
        .toFixed(DELTAFI_TOKEN_DECIMALS);
      const totalFarmRewards = claimedBaseRewards
        .plus(claimedQuoteRewards)
        .toFixed(DELTAFI_TOKEN_DECIMALS);

      userUnclaimedFarmRewards = userUnclaimedFarmRewards.plus(unclaimedFarmRewards);
      userTotalFarmRewards = userTotalFarmRewards.plus(totalFarmRewards);

      farmPoolToRewards[farmPoolKey] = { unclaimedFarmRewards, totalFarmRewards };
    }

    dispatch(rewardViewActions.setFarmPoolRewardsInfo({ farmPoolToRewards }));
    return {
      farmPoolToRewards,
      userUnclaimedFarmRewards: hasFarmUser
        ? userUnclaimedFarmRewards.toFixed(DELTAFI_TOKEN_DECIMALS)
        : "--",
      userTotalFarmRewards: hasFarmUser
        ? userTotalFarmRewards.toFixed(DELTAFI_TOKEN_DECIMALS)
        : "--",
    };
  }, [farmPoolKeyToFarmUser, farmKeyToFarmInfo, rewardView.rewardRefreshTs, dispatch]);

  const {
    owedRewardFromSwap,
    owedRewardFromReferral,
    totalRewardFromSwap,
    totalRewardFromReferral,
  } = useMemo(() => {
    const parseRewardBN = (rewardAmount: BN) =>
      exponentiatedBy(new BigNumber(rewardAmount.toString()), DELTAFI_TOKEN_DECIMALS).toString();
    if (deltafiUser?.user) {
      return {
        owedRewardFromSwap: parseRewardBN(deltafiUser.user.owedTradeRewards),
        owedRewardFromReferral: parseRewardBN(deltafiUser.user.owedReferralRewards),
        totalRewardFromSwap: parseRewardBN(
          deltafiUser.user.owedTradeRewards.add(deltafiUser.user.claimedTradeRewards),
        ),
        totalRewardFromReferral: parseRewardBN(
          deltafiUser.user.owedReferralRewards.add(deltafiUser.user.claimedReferralRewards),
        ),
      };
    }

    return {
      owedRewardFromSwap: "--",
      owedRewardFromReferral: "--",
      totalRewardFromSwap: "--",
      totalRewardFromReferral: "--",
    };
  }, [deltafiUser]);

  const handleSnackBarClose = useCallback(() => {
    dispatch(rewardViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  useEffect(() => {
    const hasDeltafiUser = deltafiUser?.user != null;
    dispatch(
      rewardViewActions.setReferralLinkState({
        referralLinkState: hasDeltafiUser ? "Ready" : "Unavailable",
      }),
    );

    if (!hasDeltafiUser) {
      return;
    }

    const host = window.location.protocol + "//" + window.location.host;
    const referralLink = host + "?referrer=" + deltafiUser?.publicKey?.toBase58();
    dispatch(rewardViewActions.setReferralLink({ referralLink }));
  }, [isConnectedWallet, deltafiUser, dispatch]);

  const handleCreateDeltafiUser = useCallback(async () => {
    try {
      if (!program) {
        return;
      }

      const connection = program.provider.connection;
      dispatch(
        rewardViewActions.setReferralLinkState({
          referralLinkState: "Processing",
        }),
      );

      let transaction = await createDeltafiUserTransaction(program, connection, walletPubkey);

      transaction = await signTransaction(transaction);
      const hash = await sendSignedTransaction({
        signedTransaction: transaction,
        connection,
      });
      await connection.confirmTransaction(hash, "confirmed");

      dispatch(fetchDeltafiUserThunk({ connection, walletAddress: walletPubkey }));
      dispatch(
        rewardViewActions.setReferralLinkState({
          referralLinkState: "Ready",
        }),
      );
    } catch (e) {
      console.error(e);
      dispatch(
        rewardViewActions.setReferralLinkState({
          referralLinkState: "Unavailable",
        }),
      );
    }
  }, [dispatch, walletPubkey, signTransaction, program]);

  const connection = program.provider.connection;
  const handleClaimSwapRewardsGenerator = useCallback(
    (isFromReferral: boolean) => async () => {
      if (!walletPubkey || !program) {
        return null;
      }

      const setIsClaimingState = isFromReferral
        ? (isClaiming: boolean) =>
            rewardViewActions.setIsClaimingReferralRewards({
              isClaimingReferralRewards: isClaiming,
            })
        : (isClaiming: boolean) =>
            rewardViewActions.setisClaimingTradeRewards({
              isClaimingTradeRewards: isClaiming,
            });

      dispatch(setIsClaimingState(true));
      try {
        const partialSignedTransaction = await createClaimSwapRewardsTransaction(
          program,
          connection,
          walletPubkey,
          userDeltafiToken?.publicKey,
          deltafiUser.user,
          isFromReferral,
        );

        const signedTransaction = await signTransaction(partialSignedTransaction);
        const signature = await sendSignedTransaction({ signedTransaction, connection });
        await connection.confirmTransaction(signature, "confirmed");
        await fetchDeltafiUserManually(connection, walletPubkey, dispatch);
        dispatch(rewardViewActions.setClaimResult({ claimResult: { status: true } }));
      } catch (e) {
        console.error(e);
        dispatch(rewardViewActions.setClaimResult({ claimResult: { status: false } }));
        // TODO(leqiang): Add error display here
      } finally {
        dispatch(rewardViewActions.setOpenSnackbar({ openSnackbar: true }));
        dispatch(setIsClaimingState(false));
      }
    },
    [connection, program, walletPubkey, userDeltafiToken, deltafiUser, dispatch, signTransaction],
  );

  // claim from multiple farms at the same time
  const handleClaimFarmRewards = useCallback(async () => {
    if (!walletPubkey || !program) {
      return null;
    }
    const connection = program.provider.connection;
    dispatch(rewardViewActions.setIsClaimingFarmRewards({ isClaimingFarmRewards: true }));
    try {
      const farmPoolInfoList = poolConfigs
        .map((poolConfig: PoolConfig) =>
          poolConfig.farmInfoList
            .filter((farm) => !!farmPoolKeyToFarmUser[farm.farmInfo])
            .map((farm) => ({ poolConfig, farmInfo: farm.farmInfo })),
        )
        .flat();

      const transaction = await createClaimFarmRewardsTransaction(
        program,
        connection,
        farmPoolInfoList,
        walletPubkey,
        userDeltafiToken?.publicKey,
      );

      const signedTransaction = await signTransaction(transaction);

      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      await connection.confirmTransaction(hash, "confirmed");
      await fetchDeltafiUserManually(connection, walletPubkey, dispatch);
      dispatch(rewardViewActions.setClaimResult({ claimResult: { status: true } }));
    } catch (e) {
      console.error(e);
      dispatch(rewardViewActions.setClaimResult({ claimResult: { status: false } }));
    } finally {
      dispatch(rewardViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(rewardViewActions.setIsClaimingFarmRewards({ isClaimingFarmRewards: false }));
      dispatch(fetchFarmUsersThunk({ connection, walletAddress: walletPubkey }));
    }
  }, [dispatch, farmPoolKeyToFarmUser, program, signTransaction, userDeltafiToken, walletPubkey]);

  const claimFarmRewardsButton = useMemo(() => {
    return (
      <StyledButton
        variant="outlined"
        disabled={
          userUnclaimedFarmRewards === "--" ||
          userTotalFarmRewards === "--" ||
          parseFloat(userUnclaimedFarmRewards) === 0
        }
        onClick={() =>
          setMenu(true, "liquidity-reward", null, {
            farmPoolRewardsInfo: {
              userUnclaimedFarmRewards,
              userTotalFarmRewards,
              farmPoolToRewards,
            },
            handleClaimFarmRewards,
          })
        }
        color="inherit"
        data-amp-analytics-on="click"
        data-amp-analytics-name="click"
        data-amp-analytics-attrs="page: Reward, target: claimRewards"
        fullWidth
      >
        <Box
          fontFamily="Rubik"
          sx={{ textTransform: "capitalize" }}
          lineHeight={1}
          fontSize={16}
          fontWeight={600}
        >
          Claim Rewards
        </Box>
      </StyledButton>
    );
  }, [
    setMenu,
    userUnclaimedFarmRewards,
    userTotalFarmRewards,
    farmPoolToRewards,
    handleClaimFarmRewards,
  ]);

  const snackMessage = useMemo(() => {
    if (!rewardView || !rewardView.claimResult) {
      return "";
    }

    if (!rewardView.claimResult.status) {
      return (
        <Box display="flex" alignItems="center">
          <img
            src={"/images/snack-fail.svg"}
            alt="snack-status-icon"
            className={classes.snackBarIcon}
          />
          <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
            Oops, someting went wrong. Please try again or contact us.
          </Box>
        </Box>
      );
    }
    return (
      <Box display="flex" alignItems="center">
        <img
          src={"/images/snack-success.svg"}
          alt="snack-status-icon"
          className={classes.snackBarIcon}
        />
        <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
          Your rewards are claim to your wallet successfully{" "}
        </Box>
      </Box>
    );
  }, [rewardView, classes.snackBarIcon]);

  const snackAction = useMemo(() => {
    return (
      <IconButton
        size="small"
        onClick={handleSnackBarClose}
        sx={{ margionTop: 0.5, color: "#fff" }}
      >
        <CloseIcon color="inherit" />
      </IconButton>
    );
  }, [handleSnackBarClose]);

  const claimSwapRewardsButtonGenerator = useMemo(
    () =>
      function generator(owedAmount: string, isFromReferral: boolean) {
        const isClaiming = isFromReferral
          ? rewardView.isClaimingReferralRewards
          : rewardView.isClaimingTradeRewards;

        if (isClaiming) {
          return (
            <StyledButton color="inherit" variant="outlined" disabled>
              <CircularProgress size={16} color="inherit" />
            </StyledButton>
          );
        }
        return (
          <StyledButton
            variant="outlined"
            onClick={handleClaimSwapRewardsGenerator(isFromReferral)}
            color="inherit"
            disabled={!(parseFloat(owedAmount) > 0)} // in case the result can be NaN
            data-amp-analytics-on="click"
            data-amp-analytics-name="click"
            data-amp-analytics-attrs="page: Reward, target: claimRewards"
          >
            <Box
              fontFamily="Rubik"
              sx={{ textTransform: "capitalize" }}
              lineHeight={1}
              fontSize={16}
              fontWeight={600}
            >
              Claim Rewards
            </Box>
          </StyledButton>
        );
      },
    [rewardView, handleClaimSwapRewardsGenerator],
  );

  return (
    <Box className={classes.root}>
      <Box className={classes.defaultWrapper}>
        <Box fontSize={20} fontWeight={700}>
          Invite friends, earn crypto together
        </Box>
        {isConnectedWallet || (
          <>
            <Box mt={1} fontSize={14} fontWeight={400} color="#f6f6f6">
              Before referral, you need to connect your wallet
            </Box>
            <Box mt={2} mb={2.5} flexDirection="column" display="flex" alignItems="center">
              <ConnectButton onClick={() => setMenu(true, "connect")}>Connect Wallet</ConnectButton>
            </Box>
            <Divider className={classes.divider} />
          </>
        )}
      </Box>

      {/* Send Invitations */}
      {isConnectedWallet && (
        <>
          <Box mt={2} mb={2.5}>
            <Box className={classes.sharePanelRow}>
              {referralLinkState === "Unavailable" ? (
                <input
                  disabled
                  placeholder={"Please Create A DELFI Token Account Before Referring Others!"}
                  className={classes.inputLink}
                />
              ) : (
                <input
                  placeholder={referralLink}
                  disabled={referralLinkState === "Processing"}
                  className={classes.inputLink}
                />
              )}
              {(() => {
                switch (referralLinkState) {
                  case "Unavailable": {
                    return (
                      <ConnectButton onClick={handleCreateDeltafiUser}>
                        {"Wallet Set Up"}
                      </ConnectButton>
                    );
                  }
                  case "Ready": {
                    return (
                      <ConnectButton
                        onClick={() => {
                          copy(referralLink);
                          dispatch(
                            rewardViewActions.setReferralLinkState({
                              referralLinkState: "Copied",
                            }),
                          );
                          setTimeout(
                            () =>
                              dispatch(
                                rewardViewActions.setReferralLinkState({
                                  referralLinkState: "Ready",
                                }),
                              ),
                            5000,
                          );
                        }}
                      >
                        {"Copy Link and Share"}
                      </ConnectButton>
                    );
                  }
                  case "Copied": {
                    return <ConnectButton>{"Copied"}</ConnectButton>;
                  }
                  case "Processing": {
                    return (
                      <ConnectButton disabled={true}>
                        <CircularProgress color="inherit" />
                      </ConnectButton>
                    );
                  }
                }
              })()}
              <Box display="flex" className={classes.socialLinks}>
                <Link
                  href={TWITTER_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-amp-analytics-on="click"
                  data-amp-analytics-name="click"
                  data-amp-analytics-attrs="page: Reward, target: Twitter"
                >
                  <ShareTwitter className={classes.shareButton} />
                </Link>

                <Link
                  href={DISCORD_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-amp-analytics-on="click"
                  data-amp-analytics-name="click"
                  data-amp-analytics-attrs="page: Reward, target: Discord"
                >
                  <ShareDiscord className={classes.shareButton} />
                </Link>
                {/* <Link
                href="https://github.com/delta-fi"
                target="_blank"
                rel="noreferrer noopener"
                data-amp-analytics-on="click"
                data-amp-analytics-name="click"
                data-amp-analytics-attrs="page: Reward, target: Github"
              >
                <ShareGithub className={classes.shareButton} />
              </Link> */}
                <Link
                  href={BLOG_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-amp-analytics-on="click"
                  data-amp-analytics-name="click"
                  data-amp-analytics-attrs="page: Reward, target: Medium"
                >
                  <ShareMedium className={classes.shareButton} />
                </Link>
                <Link
                  href={TELEGRAM_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-amp-analytics-on="click"
                  data-amp-analytics-name="click"
                  data-amp-analytics-attrs="page: Reward, target: Telegram"
                >
                  <ShareTelegram className={classes.shareButton} />
                </Link>
              </Box>
            </Box>
          </Box>
          <Divider className={classes.divider} />
        </>
      )}

      {/* How to invite friends */}
      <Box className={classes.defaultWrapper}>
        <Box fontSize={20} mb={2} fontWeight={700}>
          My Rewards
        </Box>
        {/* TODO please check and set up the true "no reward" condition */}
        {isConnectedWallet &&
        (totalRewardFromReferral !== "--" ||
          totalRewardFromSwap !== "--" ||
          userUnclaimedFarmRewards !== "--" ||
          userTotalFarmRewards !== "--") ? (
          <Box>
            <Box mt={2} mb={3} display="flex" gap={1.25} justifyContent="center" flexWrap="wrap">
              {deployMode === "mainnet-prod" || (
                <Box className={classes.rewardBox} border="1px solid #03F2A0">
                  <Box color="#03F2A0">LIQUIDITY MINING</Box>
                  <Box>Unclaimed / Total</Box>
                  <Box lineHeight="24px" display="flex" fontSize={20}>
                    <Box color="#03F2A0">{userUnclaimedFarmRewards}&nbsp;</Box>
                    <Box>/ {userTotalFarmRewards} DELFI</Box>{" "}
                  </Box>
                  <Box color="#03F2A0">{claimFarmRewardsButton}</Box>
                </Box>
              )}
              <Box className={classes.rewardBox} border="1px solid #D4FF00">
                <Box color="#D4FF00">TRADE FARMING</Box>
                <Box>Unclaimed / Total</Box>
                <Box lineHeight="24px" display="flex" fontSize={20}>
                  <Box color="#D4FF00">{owedRewardFromSwap}&nbsp;</Box>
                  <Box>/ {totalRewardFromSwap} DELFI</Box>{" "}
                </Box>
                <Box color="#D4FF00">
                  {claimSwapRewardsButtonGenerator(owedRewardFromSwap, false)}
                </Box>
              </Box>
              <Box className={classes.rewardBox} border="1px solid #905BFF">
                <Box color="#905BFF">REGERRAL BONUS</Box>
                <Box>Unclaimed / Total</Box>
                <Box lineHeight="24px" display="flex" fontSize={20}>
                  <Box color="#905BFF">{owedRewardFromReferral}&nbsp;</Box>
                  <Box>/ {totalRewardFromReferral} DELFI</Box>{" "}
                </Box>
                <Box color="#905BFF">
                  {claimSwapRewardsButtonGenerator(owedRewardFromReferral, true)}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box mt={2.5}>
            <img src="/images/ghost.svg" alt="no rewards" />
            <Box fontSize={14} lineHeight={1.2} fontWeight={400} mt={2.5}>
              No rewards, go to invite and earn
            </Box>
          </Box>
        )}
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={rewardView.openSnackbar}
        onClose={handleSnackBarClose}
        key="dashboardSnackbar"
      >
        <SnackbarContent
          aria-describedby="message-id2"
          className={classes.snackBarContent}
          message={snackMessage}
          action={snackAction}
          sx={{
            flexWrap: "nowrap",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        />
      </Snackbar>
    </Box>
  );
};
export default Home;
