import React, { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Box, Typography, makeStyles, Theme, Grid, Paper, Link, Avatar } from "@material-ui/core";
import Page from "components/layout/Page";
import { ConnectButton } from "components";
import { useModal } from "providers/modal";
import ReferralCard from "./components/ReferralCard";
import CopyLinkButton from "./components/CopyLinkButton";
import { ShareDiscord, ShareGithub, ShareMedium, ShareTelegram, ShareTwitter } from "components";
import copy from "copy-to-clipboard";

import { sendSignedTransaction } from "utils/transactions";
import loadingIcon from "components/gif/loading_white.gif";
import { useDispatch, useSelector } from "react-redux";
import {
  deltafiUserSelector,
  programSelector,
  rewardViewSelector,
  selectTokenAccountInfoByMint,
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
import { DELTAFI_TOKEN_DECIMALS } from "constants/index";
import BN from "bn.js";
import BigNumber from "bignumber.js";
import { exponentiatedBy } from "utils/decimal";
import { deployConfigV2 } from "constants/deployConfigV2";

/*
 * mockup test data for reward page
 */
const referralIntroCard = [
  {
    caption: "Get a referral link",
    detail: "Connect a wallet and generate a referral link to share.",
    image: "/images/get_referral_link.png",
  },
  {
    caption: "Share with friends",
    detail: "Invite your friends to register via your referral link.",
    image: "/images/share_friends.png",
  },
  {
    caption: "Earn crypto",
    detail: "Get referral rewards from your friends’ earnings & swaps.",
    image: "/images/earn_crypto.png",
  },
];

const useStyles = makeStyles(({ breakpoints, spacing }: Theme) => ({
  root: {
    padding: `${spacing(10)}px 0px`,
    maxWidth: 792,
    width: "100%",
    [breakpoints.down("md")]: {
      padding: "0 1rem",
    },
  },
  defaultWrapper: {
    [breakpoints.down("sm")]: {
      maxWidth: 248,
      margin: "0 auto",
    },
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
  subContentMargin3: {
    marginBottom: spacing(3),
  },
  referralTitle: {
    fontWeight: 500,
    fontSize: 28,
  },
  mainComponentMargin: {
    marginBottom: spacing(8),
  },
  inviteComponentMargin: {
    marginTop: spacing(8),
    marginBottom: spacing(8),
  },
  sharePanelRow: {
    display: "flex",
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
    "& a": {
      marginRight: spacing(3),
      [breakpoints.down("sm")]: {
        marginRight: spacing(1.5),
      },
    },
  },
  inputLink: {
    borderRadius: 12,
    background: "transparent",
    border: "1px solid #B7B4C7",
    padding: "16px 24px",
    color: "white",
    marginRight: "16px",
    flex: 1,
    outline: "none",
    [breakpoints.down("sm")]: {
      padding: "12px",
      marginRight: "8px",
      fontSize: "10px",
    },
  },
  SettingUpAccountButton: {
    width: 40,
    height: 40,
    marginTop: 4,
    marginBottom: 4,
  },
}));

const Home: React.FC = (props) => {
  const classes = useStyles(props);
  const { setMenu } = useModal();
  const wallet = useWallet();
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = wallet;
  const dispatch = useDispatch();
  const program = useSelector(programSelector);

  const rewardView = useSelector(rewardViewSelector);
  const deltafiUser = useSelector(deltafiUserSelector);
  const userDeltafiToken = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));
  const referralLinkState = rewardView.referralLinkState;
  const referralLink = rewardView.referralLink;

  const rewardDisplayInfo: {
    claimedRewardFromSwap: string;
    claimedRewardFromReferral: string;
    owedRewardFromSwap: string;
    owedRewardFromReferral: string;
  } = useMemo(() => {
    const parseRewardBN = (rewardAmount: BN) =>
      exponentiatedBy(new BigNumber(rewardAmount.toString()), DELTAFI_TOKEN_DECIMALS).toString();
    if (deltafiUser?.user) {
      return {
        claimedRewardFromSwap: parseRewardBN(deltafiUser.user.claimedSwapRewards),
        claimedRewardFromReferral: parseRewardBN(deltafiUser.user.claimedReferralRewards),
        owedRewardFromSwap: parseRewardBN(deltafiUser.user.owedSwapRewards),
        owedRewardFromReferral: parseRewardBN(deltafiUser.user.owedReferralRewards),
      };
    }

    return {
      claimedRewardFromSwap: "--",
      claimedRewardFromReferral: "--",
      owedRewardFromSwap: "--",
      owedRewardFromReferral: "--",
    };
  }, [deltafiUser]);

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

    const referralLink =
      process.env.REACT_APP_LOCAL_HOST + "?referrer=" + deltafiUser?.publicKey?.toBase58();
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
  const handleRefresh = useCallback(async () => {
    dispatch(rewardViewActions.setIsRefreshing({ isRefreshing: true }));

    try {
      await fetchDeltafiUserManually(connection, walletPubkey, dispatch);
    } catch (e) {
      console.error(e);
      // TODO(leqiang): Add error display her
    } finally {
      dispatch(rewardViewActions.setIsRefreshing({ isRefreshing: false }));
    }
  }, [connection, walletPubkey, dispatch]);

  const handleClaimRewards = useCallback(async () => {
    dispatch(rewardViewActions.setIsClaiming({ isClaiming: true }));

    try {
      const partialSignedTransaction = await createClaimSwapRewardsTransaction(
        program,
        connection,
        walletPubkey,
        userDeltafiToken?.publicKey,
        deltafiUser.user,
      );

      const signedTransaction = await signTransaction(partialSignedTransaction);
      const signature = await sendSignedTransaction({ signedTransaction, connection });
      await connection.confirmTransaction(signature, "confirmed");
      await fetchDeltafiUserManually(connection, walletPubkey, dispatch);
    } catch (e) {
      console.error(e);
      // TODO(leqiang): Add error display here
    } finally {
      dispatch(rewardViewActions.setIsClaiming({ isClaiming: false }));
    }
  }, [connection, program, walletPubkey, userDeltafiToken, deltafiUser, dispatch, signTransaction]);

  const refreshButton = useMemo(() => {
    if (rewardView.isRefreshing) {
      return (
        <ConnectButton variant="contained" disabled={true}>
          <Avatar src={loadingIcon} />
        </ConnectButton>
      );
    }
    return (
      <ConnectButton
        variant="contained"
        onClick={handleRefresh}
        disabled={!deltafiUser?.user}
        data-amp-analytics-on="click"
        data-amp-analytics-name="click"
        data-amp-analytics-attrs="page: Reward, target: Refresh"
      >
        Refresh
      </ConnectButton>
    );
  }, [rewardView, deltafiUser, handleRefresh]);

  const claimRewardsButton = useMemo(() => {
    if (rewardView.isClaiming) {
      return (
        <ConnectButton variant="contained" disabled={true}>
          <Avatar src={loadingIcon} />
        </ConnectButton>
      );
    }
    return (
      <ConnectButton
        variant="contained"
        onClick={handleClaimRewards}
        disabled={
          !deltafiUser?.user?.owedReferralRewards ||
          !deltafiUser?.user?.owedSwapRewards ||
          deltafiUser?.user.owedReferralRewards.add(deltafiUser?.user.owedSwapRewards).eq(new BN(0))
        }
        data-amp-analytics-on="click"
        data-amp-analytics-name="click"
        data-amp-analytics-attrs="page: Reward, target: claimRewards"
      >
        Claim Rewards
      </ConnectButton>
    );
  }, [rewardView, deltafiUser, handleClaimRewards]);

  return (
    <Page>
      <Box className={classes.root}>
        <Box className={classes.defaultWrapper}>
          <Typography
            variant="h4"
            color="primary"
            align="center"
            className={classes.fontBold}
            paragraph
          >
            Invite friends, earn crypto together
          </Typography>

          {/* Connect Wallet */}
          {!isConnectedWallet && (
            <Box
              flexDirection="column"
              display="flex"
              alignItems="center"
              className={classes.mainComponentMargin}
            >
              <Typography
                variant="subtitle1"
                align="center"
                className={classes.subContent}
                paragraph
              >
                Before referral, you need to connect your wallet
              </Typography>
              <ConnectButton onClick={() => setMenu(true, "connect")}>Connect Wallet</ConnectButton>
            </Box>
          )}
        </Box>

        {/* Send Invitations */}
        {isConnectedWallet && (
          <>
            <Box className={classes.inviteComponentMargin}>
              <Typography variant="h5" color="primary" align="center" paragraph>
                Send Invitations
              </Typography>

              <Paper className={classes.sharePannel}>
                <Typography
                  variant="subtitle1"
                  color="primary"
                  className={classes.subContentMargin2}
                >
                  My Referral Link
                </Typography>
                <Box className={`${classes.subContentMargin3} ${classes.sharePanelRow}`}>
                  {referralLinkState === "Unavailable" ? (
                    <input
                      disabled={true}
                      placeholder={"Please Create A DELFI User Before Referring Others!"}
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
                          <CopyLinkButton onClick={handleCreateDeltafiUser}>
                            {"Wallet Set Up"}
                          </CopyLinkButton>
                        );
                      }
                      case "Ready": {
                        return (
                          <CopyLinkButton
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
                            {"Copy Link"}
                          </CopyLinkButton>
                        );
                      }
                      case "Copied": {
                        return <CopyLinkButton>{"Copied"}</CopyLinkButton>;
                      }
                      case "Processing": {
                        return (
                          <CopyLinkButton disabled={true}>
                            <Avatar className={classes.SettingUpAccountButton} src={loadingIcon} />
                          </CopyLinkButton>
                        );
                      }
                    }
                  })()}
                </Box>
                <Box className={classes.sharePanelRow}>
                  <Typography variant="subtitle1" color="primary" className={classes.shareLabel}>
                    Share
                  </Typography>
                  <Box display="flex" className={classes.socialLinks}>
                    <Link
                      href="https://twitter.com/deltafi_ai"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Twitter"
                    >
                      <ShareTwitter className={classes.shareButton} />
                    </Link>

                    <Link
                      href="https://discord.gg/deltafi"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Discord"
                    >
                      <ShareDiscord className={classes.shareButton} />
                    </Link>
                    <Link
                      href="https://github.com/delta-fi"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Github"
                    >
                      <ShareGithub className={classes.shareButton} />
                    </Link>
                    <Link
                      href="https://medium.com/deltafi"
                      target="_blank"
                      rel="noreferrer noopener"
                      data-amp-analytics-on="click"
                      data-amp-analytics-name="click"
                      data-amp-analytics-attrs="page: Reward, target: Medium"
                    >
                      <ShareMedium className={classes.shareButton} />
                    </Link>
                    <Link
                      href="https://t.me/deltafi_ai"
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
              </Paper>
            </Box>
          </>
        )}

        {/* How to invite friends */}
        <Box className={classes.defaultWrapper}>
          <Typography variant="h5" color="primary" align="center" paragraph>
            How to invite friends
          </Typography>
          <Grid container spacing={2} style={{ width: "100%", margin: 0 }}>
            {referralIntroCard.map((item, index) => (
              <Grid item xs={12} sm={4} md={4} key={index}>
                <ReferralCard caption={item.caption} detail={item.detail} image={item.image} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Rewards summary */}
        {/* TODO: improve layout of this section */}
        <Box className={classes.defaultWrapper}>
          <Typography variant="h5" color="primary" align="center" paragraph>
            Rewards Summary
          </Typography>
          <Grid container spacing={2} style={{ width: "100%", margin: 0 }}>
            <Grid item xs={12} sm={4} md={4}>
              <Typography variant="h6" color="primary" align="left" paragraph>
                Reward Claimed
              </Typography>
              <Box>{`From Swap: ${rewardDisplayInfo.claimedRewardFromSwap}`}</Box>
              <Box>{`From Referral: ${rewardDisplayInfo.claimedRewardFromReferral}`}</Box>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <Typography variant="h6" color="primary" align="left" paragraph>
                Reward Owed
              </Typography>
              <Box>{`From Swap: ${rewardDisplayInfo.owedRewardFromSwap}`}</Box>
              <Box>{`From Referral: ${rewardDisplayInfo.owedRewardFromReferral}`}</Box>
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <Box>{refreshButton}</Box>
              <Box>{claimRewardsButton}</Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Page>
  );
};
export default Home;
