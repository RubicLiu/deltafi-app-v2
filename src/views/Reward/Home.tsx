import React, { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { makeStyles, Theme, Link, Divider, CircularProgress } from "@material-ui/core";
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
import { Box, Button } from "@mui/material";
import styled from "styled-components";

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
    justifyContent: "center",
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
  padding: 16px 20px;
  border-radius: 50px;
  min-width: 160px;
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
  const userDeltafiToken = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));
  const referralLinkState = rewardView.referralLinkState;
  const referralLink = rewardView.referralLink;

  const rewardDisplayInfo: {
    claimedRewardFromSwap: string;
    claimedRewardFromReferral: string;
    owedRewardFromSwap: string;
    owedRewardFromReferral: string;
    totalRewardFromSwap: string;
    totalRewardFromReferral: string;
  } = useMemo(() => {
    const parseRewardBN = (rewardAmount: BN) =>
      exponentiatedBy(new BigNumber(rewardAmount.toString()), DELTAFI_TOKEN_DECIMALS).toString();
    if (deltafiUser?.user) {
      return {
        claimedRewardFromSwap: parseRewardBN(deltafiUser.user.claimedSwapRewards),
        claimedRewardFromReferral: parseRewardBN(deltafiUser.user.claimedReferralRewards),
        owedRewardFromSwap: parseRewardBN(deltafiUser.user.owedSwapRewards),
        owedRewardFromReferral: parseRewardBN(deltafiUser.user.owedReferralRewards),
        totalRewardFromSwap: parseRewardBN(
          deltafiUser.user.owedSwapRewards.add(deltafiUser.user.claimedSwapRewards),
        ),
        totalRewardFromReferral: parseRewardBN(
          deltafiUser.user.owedReferralRewards.add(deltafiUser.user.claimedReferralRewards),
        ),
      };
    }

    return {
      claimedRewardFromSwap: "--",
      claimedRewardFromReferral: "--",
      owedRewardFromSwap: "--",
      owedRewardFromReferral: "--",
      totalRewardFromSwap: "--",
      totalRewardFromReferral: "--",
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
        <Button variant="contained" disabled={true}>
          <CircularProgress color="inherit" />
        </Button>
      );
    }
    return (
      <Button
        variant="contained"
        onClick={handleRefresh}
        disabled={!deltafiUser?.user}
        data-amp-analytics-on="click"
        data-amp-analytics-name="click"
        data-amp-analytics-attrs="page: Reward, target: Refresh"
      >
        Refresh
      </Button>
    );
  }, [rewardView, deltafiUser, handleRefresh]);

  const claimRewardsButton = useMemo(() => {
    if (rewardView.isClaiming) {
      return (
        <StyledButton color="inherit" variant="outlined" disabled>
          <CircularProgress size={16} color="inherit" />
        </StyledButton>
      );
    }
    return (
      <StyledButton
        variant="outlined"
        onClick={handleClaimRewards}
        color="inherit"
        disabled={
          !deltafiUser?.user?.owedReferralRewards ||
          !deltafiUser?.user?.owedSwapRewards ||
          deltafiUser?.user.owedReferralRewards.add(deltafiUser?.user.owedSwapRewards).eq(new BN(0))
        }
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
  }, [rewardView, deltafiUser, handleClaimRewards]);

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
          My Rewards
        </Box>
        {isConnectedWallet ? (
          <Box>
            <Box mt={2} mb={3} display="flex" gap={1.25} justifyContent="center">
              <Box className={classes.rewardBox} border="1px solid #D4FF00">
                <Box color="#D4FF00">TRADE FARMING</Box>
                <Box mt={1.5} color="#D3D3D3">
                  Unclaimed / Total
                </Box>
                <Box mt={2} display="flex" fontSize={20}>
                  <Box color="#D4FF00">{rewardDisplayInfo.claimedRewardFromSwap}&nbsp;</Box>
                  <Box>/ {rewardDisplayInfo.totalRewardFromSwap} DELFI</Box>{" "}
                </Box>
                <Box color="#D4FF00" mt={1.5}>
                  {claimRewardsButton}
                </Box>
              </Box>
              <Box className={classes.rewardBox} border="1px solid #693EFF">
                <Box color="#693EFF">REGERRAL BONUS</Box>
                <Box mt={1.5} color="#693EFF">
                  Unclaimed / Total
                </Box>
                <Box mt={2} display="flex" fontSize={20}>
                  <Box color="#693EFF">{rewardDisplayInfo.claimedRewardFromReferral}&nbsp;</Box>
                  <Box>/ {rewardDisplayInfo.totalRewardFromReferral} DELFI</Box>{" "}
                </Box>
                <Box color="#693EFF" mt={1.5}>
                  {claimRewardsButton}
                </Box>
              </Box>
            </Box>
            <Box mt={2} fontSize={16} fontWeight={700}>
              Reward Owed
            </Box>
            <Box mt={2.5} display="flex" gap={20} justifyContent="center">
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
            <Box display="flex" gap={20} justifyContent="center" mt={3}>
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
