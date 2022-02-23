import { ReactElement, useState, useMemo, useCallback } from "react";
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
} from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import BigNumber from "bignumber.js";

import StakeCard from "views/Stake/components/Card";
import { StakeCard as IStakeCard } from "views/Stake/components/types";
import Page from "components/layout/Page";
import { ConnectButton, LinkIcon } from "components";

import useStyles from "./styles";
import { getFarmTokenInfo, useTokenFromMint, useTokenMintAccount } from "providers/tokens";
import { useFarmPoolByAddress, useFarmUserAccount } from "providers/farm";
import { lpTokens } from "constants/tokens";
import { useModal } from "providers/modal";
import { useConfig } from "providers/config";
import { sendSignedTransaction, claim, stake, unstake } from "utils/transactions";
import { exponentiate, exponentiatedBy } from "utils/decimal";
import { DELTAFI_TOKEN_MINT, SOLSCAN_LINK } from "constants/index";
import { useCustomConnection } from "providers/connection";
import Slider from "./components/Slider";

interface TransactionResult {
  status: boolean | null
  action?: "stake" | "unstake" | "claim"
  hash?: string
  stake?: IStakeCard
}

const SECONDS_OF_YEAR = 31556926;

const getUnclaimedReward = (
  apr : BigNumber, 
  lastUpdateTs: BigNumber, 
  nextClaimTs: BigNumber, 
  rewardDebt: BigNumber, 
  rewardEstimated: BigNumber, 
  depositBalance: BigNumber,
  deltafiTokenDecimals: number
) => {
  const currentTs: BigNumber = (new BigNumber(Date.now())).div(new BigNumber(1000));
  if (currentTs <= nextClaimTs) {
    return exponentiatedBy(rewardDebt, deltafiTokenDecimals);
  }
  const unTrackedReward: BigNumber = 
    currentTs
    .minus(lastUpdateTs)
    .div(new BigNumber(SECONDS_OF_YEAR))
    .multipliedBy(depositBalance)
    .multipliedBy(apr);
  
  return exponentiatedBy(unTrackedReward.plus(rewardDebt).plus(rewardEstimated), deltafiTokenDecimals);
};

const Stake = (): ReactElement => {
  const classes = useStyles();
  const location = useLocation();
  const farmPoolId = location.pathname.split("/").pop();
  const farmPool = useFarmPoolByAddress(farmPoolId);
  
  const { connected: isConnectedWallet, publicKey: walletPubkey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { network } = useCustomConnection();
  const token = getFarmTokenInfo(farmPool?.name);
  const tokenAccount = useTokenFromMint(token?.address);

  const [staking, setStaking] = useState({
    isStake: true,
    token: token,
    balance: null,
    amount: "",
  });

  const tokenBalance = useMemo(() => {
    if (tokenAccount) {
      const value = exponentiatedBy(tokenAccount.account.amount, staking.token.decimals);
      if (staking.isStake) {
        setStaking({...staking, balance: value});
      }
      return value;
    }
    return null;
  }, [tokenAccount, staking]);

  const [percentage, setPercentage] = useState(0);
  const { setMenu } = useModal();
  const [state, setState] = useState<{
    open: boolean
    vertical: "bottom" | "top"
    horizontal: "left" | "center" | "right"
  }>({
    open: false,
    vertical: "bottom",
    horizontal: "left",
  });

  const { config } = useConfig();
  const lpToken = useTokenFromMint(farmPool?.poolMintKey.toBase58());
  const lpMint = useTokenMintAccount(farmPool?.poolMintKey);
  const deltafiTokenMint = useTokenMintAccount(DELTAFI_TOKEN_MINT);
  const [farmUser] = useFarmUserAccount();
  const rewardsAccount = useTokenFromMint(DELTAFI_TOKEN_MINT.toBase58());
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({
    status: null,
  });

  const totalStaked = useMemo(() => {
    if (farmPool && lpMint) {
      return exponentiatedBy(farmPool.reservedAmount.toString(), lpMint.decimals);
    }
    return new BigNumber(0);
  }, [farmPool, lpMint]);

  const position = useMemo(() => farmUser?.positions[farmPoolId], [farmUser, farmPoolId]);
  const apr = (new BigNumber(farmPool.aprNumerator.toString())).div(new BigNumber(farmPool.aprDenominator.toString()));

  /*eslint-disable */
  const depositAmount = useMemo(() => {
    if (position && lpMint) {
      const value = exponentiatedBy(position.depositBalance, lpMint.decimals);
      if (!staking.isStake) {
        setStaking({...staking, balance: value});
      }
      return exponentiatedBy(position.depositBalance, lpMint.decimals);
    }
    return new BigNumber(0);
  }, [position, lpMint]);
  /*eslint-enable */

  const unclaimedReward = useMemo(() => {
    if (position && deltafiTokenMint) {
      return getUnclaimedReward(
        apr, 
        position.lastUpdateTs, 
        position.nextClaimTs, 
        position.rewardDebt, 
        position.rewardEstimated, 
        position.depositBalance, 
        deltafiTokenMint.decimals
      );
    }
    return new BigNumber(0);
  }, [position, deltafiTokenMint, apr]);

  const poolRate = useMemo(() => {
    if (farmPool && totalStaked) {
      const apr = new BigNumber(farmPool.aprNumerator.toString())
        .dividedBy(farmPool.aprDenominator.toString())
        .toFixed(3);
      return totalStaked.multipliedBy(apr).toFixed(3);
    }
  }, [farmPool, totalStaked]);

  const handleSwitchMethod = (method: "stake" | "unstake") => {
    setPercentage(0);
    setStaking((staking) => ({ ...staking, isStake: method === "stake" ? true : false, balance: method === "stake" ? tokenBalance : depositAmount, amount: "" }));
  };

  const handleStake = useCallback(async () => {
    if (!connection || !farmPool || !walletPubkey || !lpMint || !lpToken) {
      return null;
    }
    if (staking.isStake) {
      if (staking.amount === "" || new BigNumber(lpToken.account.amount).lt(staking.amount)) {
        return null;
      }

      try {
        const transaction = await stake({
          connection,
          walletPubkey,
          config,
          farmPool,
          farmUser: farmUser?.publicKey,
          poolTokenAccount: lpToken,
          stakeData: {
            amount: BigInt(exponentiate(staking.amount, lpMint.decimals).integerValue().toString()),
          },
        });

        const signedTransaction = await signTransaction(transaction);

        const hash = await sendSignedTransaction({
          signedTransaction,
          connection,
        });

        setTransactionResult({
          status: true,
          action: "stake",
          hash,
          stake: staking,
        });

        setStaking({ ...staking, amount: "" });
      } catch (e) {
        setTransactionResult({ status: false });
      }
    } else {
      if (staking.amount === "" || !position || depositAmount.lt(staking.amount)) {
        console.log("null unstake", staking.amount, position, depositAmount);
        return null;
      }

      try {
        const transaction = await unstake({
          connection,
          walletPubkey,
          farmPool,
          farmUser: farmUser?.publicKey,
          poolTokenAccount: lpToken,
          unstakeData: {
            amount: BigInt(exponentiate(staking.amount, lpMint.decimals).integerValue().toString()),
          },
        });

        const signedTransaction = await signTransaction(transaction);

        const hash = await sendSignedTransaction({
          signedTransaction,
          connection,
        });

        setTransactionResult({
          status: true,
          action: "unstake",
          hash,
          stake: staking,
        });

        setStaking({ ...staking, amount: "" });
      } catch (e) {
        setTransactionResult({ status: false });
      }
    }

    setState((state) => ({ ...state, open: true }));
  }, [
    connection,
    walletPubkey,
    config,
    farmPool,
    farmUser,
    staking,
    lpMint,
    lpToken,
    signTransaction,
    position,
    depositAmount,
  ]);

  const handleClaim = useCallback(async () => {
    if (!connection || !farmPool || !walletPubkey || !lpMint || !lpToken) {
      return null;
    }

    try {
      const transaction = await claim({
        connection,
        config,
        walletPubkey,
        farmPool,
        farmUser: farmUser.publicKey,
        claimDestination: rewardsAccount?.pubkey,
      });
      const signedTransaction = await signTransaction(transaction);
      const hash = await sendSignedTransaction({
        signedTransaction,
        connection,
      });

      setTransactionResult({
        status: true,
        action: "claim",
        hash,
      });
    } catch (e) {
      console.log(e);
      setTransactionResult({ status: false });
    }
  }, [config, connection, farmPool, farmUser, lpMint, lpToken, signTransaction, walletPubkey, rewardsAccount]);

  const handleSnackBarClose = useCallback(() => {
    setState((state) => ({ ...state, open: false }));
  }, []);

  const snackAction = useMemo(() => {
    return (
      <IconButton size="small" onClick={handleSnackBarClose} className={classes.snackBarClose}>
        <CloseIcon />
      </IconButton>
    );
  }, [handleSnackBarClose, classes]);

  const snackMessasge = useMemo(() => {
    if (!transactionResult.status) {
      return (
        <Box display="flex" alignItems="center">
          <img src={"/images/snack-fail.svg"} alt="snack-status-icon" className={classes.snackBarIcon} />
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

    const { hash, action, stake } = transactionResult;

    return (
      <Box display="flex" alignItems="center">
        <img src={"/images/snack-success.svg"} alt="snack-status-icon" className={classes.snackBarIcon} />
        <Box>
          {stake && (
            <Typography variant="body1" color="primary">
              {`${action.charAt(0).toUpperCase() + action.slice(1)} ${Number(stake?.amount).toFixed(2)} ${
                stake.token.symbol
              } LP`}
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
  }, [transactionResult, classes, network]);

  if (!farmPool) return null;

  const { vertical, horizontal, open } = state;

  return (
    <Page>
      <Container className={classes.root}>
        <Box display="flex" justifyContent="space-between" pb={2}>
          <Typography variant="h6">{farmPool.name} Liquidity Mining</Typography>
          <Box className={classes.iconGroup}>
            <img
              src={farmPool.baseTokenInfo.logoURI}
              alt="staking-coin"
              className={clx(classes.coinIcon, classes.firstCoin)}
            />
            <img src={farmPool.quoteTokenInfo.logoURI} alt="earning-coin" className={classes.coinIcon} />
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" pb={4}>
          <Box>
            <Typography>Total Staked</Typography>
            <Typography>{`${totalStaked.toFixed(2).toString()} ${farmPool.name}`}</Typography>
          </Box>
          <Box>
            <Typography>Pool Rate</Typography>
            <Typography>{poolRate} DLT / day</Typography>
          </Box>
        </Box>

        {isConnectedWallet && (
          <Box className={classes.desc}>
            <Typography variant="h6" paragraph>
              About DeltaFi LT Tokens
            </Typography>
            <Typography variant="subtitle2">
              DL tokens are tokens which represent a share of the liquidity provided to a DeltaFi staking pool. You may
              obtain DL tokens by depositing USD Coin (USDC) or USDT (USDT) into the USDT-USDC pool.
            </Typography>
            <Box display="flex" alignItems="center" mt={3}>
              <Link
                href="/DLT"
                target="_blank"
                rel="noreferrer noopener"
                underline="always"
                className={classes.link}
                data-amp-analytics-on="click"
                data-amp-analytics-name="click"
                data-amp-analytics-attrs="page: Farms, target: DLT"
              >
                Deposit into the {farmPool.name} Pool
                <LinkIcon className={classes.linkIcon} isDark width="15px" />
              </Link>
            </Box>
          </Box>
        )}

        <Box className={classes.liquidityStaked}>
          <Typography className={classes.title}>Your Liquidity Staked</Typography>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{depositAmount.toString()}</Typography>
            <Typography className={classes.amount}>{farmPool.name} DLT</Typography>
          </Box>
        </Box>
        <Box className={classes.unclaimedToken}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography className={classes.title}>Your Unclaimed Token</Typography>
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
          </Box>
          <Box className={classes.cardBottom}>
            <Typography className={classes.amount}>{deltafiTokenMint ? unclaimedReward.toFixed(deltafiTokenMint.decimals) : "--"}</Typography>
            <Typography className={classes.amount}>0 / Day</Typography>
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
            <Slider value={percentage} onChange={setPercentage} />
          </Box>

          <Box display="flex" flexDirection="column" alignItems="flex-end">
            <StakeCard
              card={staking}
              handleChangeCard={setStaking}
              tokens={lpTokens}
              disableDrop
              percentage={percentage}
            />
          </Box>
          <Box marginTop={2} width="100%">
            {isConnectedWallet ? (
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
        open={open}
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
