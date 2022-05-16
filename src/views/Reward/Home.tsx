import React, { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Box, makeStyles, Theme, Link, Divider, CircularProgress } from "@material-ui/core";
import { ConnectButton } from "components";
import { useModal } from "providers/modal";
import { ShareDiscord, ShareMedium, ShareTelegram, ShareTwitter } from "components";
import copy from "copy-to-clipboard";

import { sendSignedTransaction } from "utils/transactions";
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

// /*
//  * mockup test data for reward page
//  */
// const referralIntroCard = [
//   {
//     caption: "Get a referral link",
//     detail: "Connect a wallet and generate a referral link to share.",
//     image: "/images/get_referral_link.png",
//   },
//   {
//     caption: "Share with friends",
//     detail: "Invite your friends to register via your referral link.",
//     image: "/images/share_friends.png",
//   },
//   {
//     caption: "Earn crypto",
//     detail: "Get referral rewards from your friends’ earnings & swaps.",
//     image: "/images/earn_crypto.png",
//   },
// ];

const useStyles = makeStyles(({ breakpoints, spacing }: Theme) => ({
  root: {
    width: "100%",
    margin: "auto",
  },
  defaultWrapper: {
    marginTop: 30,
    textAlign: "center",
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
  referralTitle: {
    fontWeight: 500,
    fontSize: 28,
  },
  sharePanelRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
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
    border: "none",
    padding: "16px 40px",
    maxWidth: 512,
    color: "white",
    marginRight: "16px",
    background: "#1C1C1C",
    borderRadius: 20,
    flex: 1,
    outline: "none",
    [breakpoints.down("sm")]: {
      padding: "12px",
      marginRight: "8px",
      fontSize: "10px",
    },
  },
  SettingUpAccountButton: {
    marginLeft: 45,
    marginRight: 45,
    width: 24,
    height: 24,
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
    "&.first": {
      border: "1px solid #D4FF00",
      color: "#D4FF00",
    },
    border: "1px solid #03F2A0",
    background: "#1C1C1C",
    borderRadius: 10,
    height: 100,
    width: 200,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    color: "#03F2A0",
    "& .label": {
      fontSize: 20,
      fontWeight: 600,
    },
    "& .value": {
      fontSize: 14,
      fontWeight: 500,
      color: "#d3d3d3",
    },
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
          <CircularProgress color="inherit" />
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
          <CircularProgress color="inherit" />
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
    <Box className={classes.root}>
      <Box className={classes.defaultWrapper}>
        <Box fontSize={20} fontWeight={700} mt={1}>
          Invite friends, earn crypto together
        </Box>
        <Box mt={0.5} fontSize={14} fontWeight={400} color="#f6f6f6">
          {!isConnectedWallet
            ? "Before referral, you need to connect your wallet"
            : "Invite your friends to register via your referral link."}
        </Box>

        {/* Connect Wallet */}
        {!isConnectedWallet && (
          <>
            <Box mt={5} mb={7.5} flexDirection="column" display="flex" alignItems="center">
              <ConnectButton onClick={() => setMenu(true, "connect")}>Connect Wallet</ConnectButton>
            </Box>
            <Divider className={classes.divider} />
          </>
        )}
      </Box>

      {/* Send Invitations */}
      {isConnectedWallet && (
        <>
          <Box mt={5} mb={7.5}>
            <Box className={classes.sharePanelRow}>
              {referralLinkState === "Unavailable" ? (
                <input
                  disabled={true}
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
                        {"Copy Link"}
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
              <Divider className={classes.verticalDiver} orientation="vertical" flexItem />
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
          </Box>
          <Divider className={classes.divider} />
        </>
      )}

      {/* How to invite friends */}
      <Box className={classes.defaultWrapper}>
        <Box fontSize={20} mb={2} fontWeight={700}>
          Rewards Summary
        </Box>
        {isConnectedWallet ? (
          <Box>
            <Box mt={3} fontSize={16} fontWeight={700}>
              Reward Claimed
            </Box>
            <Box mt={2.5} mb={3} display="flex" gridGap={20} justifyContent="center">
              <Box className={`${classes.rewardBox} first`}>
                <Box className="label">{rewardDisplayInfo.claimedRewardFromSwap}</Box>
                <Box className="value" mt={0.5}>
                  From Swap
                </Box>
              </Box>
              <Box className={classes.rewardBox}>
                <Box className="label">{rewardDisplayInfo.claimedRewardFromReferral}</Box>
                <Box className="value" mt={0.5}>
                  From Referral
                </Box>
              </Box>
            </Box>
            <Box mt={2} fontSize={16} fontWeight={700}>
              Reward Owed
            </Box>
            <Box mt={2.5} display="flex" gridGap={20} justifyContent="center">
              <Box className={`${classes.rewardBox} first`}>
                <Box className="label">{rewardDisplayInfo.owedRewardFromSwap}</Box>
                <Box className="value" mt={0.5}>
                  From Swap
                </Box>
              </Box>
              <Box className={classes.rewardBox}>
                <Box className="label">{rewardDisplayInfo.owedRewardFromReferral}</Box>
                <Box className="value" mt={0.5}>
                  From Referral
                </Box>
              </Box>
            </Box>
            <Box display="flex" gridGap={20} justifyContent="center" mt={3}>
              <Box>{refreshButton}</Box>
              <Box>{claimRewardsButton}</Box>
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
    </Box>
  );
};
export default Home;
