import {
  Avatar,
  Box,
  Grid,
  CircularProgress,
  Snackbar,
  SnackbarContent,
  Theme,
  IconButton,
} from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import { deployConfigV2, PoolConfig } from "constants/deployConfigV2";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDeltafiUserManually } from "states/accounts/deltafiUserAccount";
import BN from "bn.js";
import {
  deltafiUserSelector,
  programSelector,
  rewardViewSelector,
  selectTokenAccountInfoByMint,
} from "states/selectors";
import { rewardViewActions } from "states/views/rewardView";
import styled from "styled-components";
import { sendSignedTransaction } from "utils/transactions";
import { createClaimSwapRewardsTransaction } from "utils/transactions/deltafiUser";
import { ConnectButton } from "components";
import { makeStyles } from "@mui/styles";
import CloseIcon from "@mui/icons-material/Close";

interface CardProps {
  poolConfig: PoolConfig;
}

const StyledConnectButton = styled(ConnectButton)`
  button {
    background: #333333;
  }
`;

const useStyles = makeStyles(({ palette, breakpoints, spacing }: Theme) => ({
  snackBarContent: {
    maxWidth: 385,
    backgroundColor: "3D3D3D",
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    flexDirection: "row",
  },
}));

const Card: React.FC<CardProps> = (props) => {
  const { poolConfig } = props;
  const { baseTokenInfo, quoteTokenInfo } = poolConfig;
  const rewardView = useSelector(rewardViewSelector);
  const dispatch = useDispatch();
  const wallet = useWallet();
  const { publicKey: walletPubkey, signTransaction } = wallet;
  const userDeltafiToken = useSelector(selectTokenAccountInfoByMint(deployConfigV2.deltafiMint));
  const program = useSelector(programSelector);
  const deltafiUser = useSelector(deltafiUserSelector);
  const connection = program.provider.connection;
  const classes = useStyles(props);

  //TODO: please update with correct handler
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
      dispatch(rewardViewActions.setClaimResult({ claimResult: { status: true } }));
    } catch (e) {
      console.error(e);
      // TODO(leqiang): Add error display here
      dispatch(rewardViewActions.setClaimResult({ claimResult: { status: false } }));
    } finally {
      dispatch(rewardViewActions.setOpenSnackbar({ openSnackbar: true }));
      dispatch(rewardViewActions.setIsClaiming({ isClaiming: false }));
    }
  }, [connection, program, walletPubkey, userDeltafiToken, deltafiUser, dispatch, signTransaction]);

  const handleSnackBarClose = useCallback(() => {
    dispatch(rewardViewActions.setOpenSnackbar({ openSnackbar: false }));
  }, [dispatch]);

  const snackMessage = useMemo(() => {
    if (!rewardView || !rewardView.claimResult) {
      return "";
    }

    if (!rewardView.claimResult.status) {
      return (
        <Box display="flex" alignItems="center">
          <Box component="img" src={"/images/snack-fail.svg"} alt="snack-status-icon" mr={2} />
          <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
            Oops, someting went wrong. Please try again or contact us.
          </Box>
        </Box>
      );
    }
    return (
      <Box display="flex" alignItems="center">
        <Box component="img" mr={2} src={"/images/snack-success.svg"} alt="snack-status-icon" />
        <Box fontSize={14} fontWeight={400} lineHeight={1.5} color="#fff">
          Your rewards are claim to your wallet successfully{" "}
        </Box>
      </Box>
    );
  }, [rewardView]);

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
  const claimRewardsButton = useMemo(() => {
    if (rewardView.isClaiming) {
      return (
        <StyledConnectButton variant="outlined" disabled>
          <CircularProgress size={24} color="inherit" />
        </StyledConnectButton>
      );
    }
    return (
      <StyledConnectButton
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
          lineHeight={{ xs: "24px", md: "24px" }}
          fontSize={{ xs: 12, md: 16 }}
          fontWeight={600}
          color="#fff"
        >
          Claim Rewards
        </Box>
      </StyledConnectButton>
    );
  }, [rewardView, deltafiUser, handleClaimRewards]);

  return (
    <Box
      fontSize={{ md: 14, xs: 12 }}
      padding={{ md: 2.5, xs: 1 }}
      minWidth={{ md: 480 }}
      mt={1.25}
      lineHeight={1}
      sx={{
        background: "#333",
        boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.05)",
        borderRadius: "10px",
      }}
    >
      <Grid container alignItems="center">
        <Grid item xs={6} md={2} display="flex" flexDirection="column" alignItems="center">
          <Box display="flex" gap={-1}>
            <Avatar
              sx={{
                height: 30,
                width: 30,
                border: "1px solid #D4FF00",
              }}
              src={baseTokenInfo.logoURI}
              alt={`${baseTokenInfo.name} coin`}
            />
            <Avatar
              src={quoteTokenInfo.logoURI}
              alt={`${quoteTokenInfo.name} coin`}
              sx={{
                height: 30,
                width: 30,
                marginLeft: -0.5,
                border: "1px solid #D4FF00",
              }}
            />
          </Box>
          <Box mt={0.5} whiteSpace="nowrap">
            {poolConfig.name}
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box ml={{ md: 2 }}>
            <Box color="#D3D3D3" fontWeight={500} whiteSpace="nowrap">
              Unclaimed / Total
            </Box>
            {/* TODO replace the placeholder with real data */}
            <Box
              mt={1}
              display="flex"
              fontSize={{ xs: 14, md: 18 }}
              fontWeight={500}
              sx={{
                whiteSpace: "nowrap",
                flexWrap: "nowrap",
              }}
            >
              <Box color="#D4FF00">{200}&nbsp;</Box>
              <Box>/ {999} DELFI</Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box
            width={{ xs: 260, md: 152 }}
            ml="auto"
            mr={{ xs: "auto", md: 0 }}
            mt={{ xs: 1.5, md: 0 }}
          >
            {claimRewardsButton}
          </Box>
        </Grid>
      </Grid>
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
export default Card;
