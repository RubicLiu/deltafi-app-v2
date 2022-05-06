import { useMemo } from "react";
import { Box, makeStyles, Typography } from "@material-ui/core";
import { useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";

import Page from "components/layout/Page";
import PoolCard from "./components/Card";
import { convertDollar, getTokenTvl } from "utils/utils";
import { PoolConfig, poolConfigs } from "constants/deployConfigV2";
import { useSelector } from "react-redux";
import { pythSelector, poolSelector, tokenAccountSelector, lpUserSelector } from "states/selectors";
import { MintToTokenAccountInfo } from "states/accounts/tokenAccount";
import { getPythMarketPrice } from "states/accounts/pythAccount";

function hasDeposit(
  mintToTokenAccountInfo: MintToTokenAccountInfo,
  swapKeyToLpUser,
  poolConfig: PoolConfig,
) {
  if (mintToTokenAccountInfo == null) {
    return false;
  }
  if (swapKeyToLpUser == null) {
    return false;
  }
  const lpUser = swapKeyToLpUser[poolConfig.swapInfo];
  return (
    lpUser &&
    (lpUser.baseShare > 0 ||
      lpUser.quoteShare > 0 ||
      lpUser.basePosition.depositedAmount > 0 ||
      lpUser.quotePosition.depositedAmount > 0)
  );
}

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  container: {
    width: "100%",
    flex: 1,
    padding: `0px ${spacing(2)}px`,
    marginBottom: spacing(2),
    [breakpoints.up("sm")]: {
      maxWidth: 560,
    },
  },
  listContainer: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      borderRadius: spacing(3),
      padding: `${spacing(5)}px ${spacing(4)}px`,
    },
  },
  poolCardContainer: {
    marginBottom: spacing(2),
    "&:last-child": {
      marginBottom: 0,
    },
  },
}));

const Home: React.FC = () => {
  const classes = useStyles();

  const poolState = useSelector(poolSelector);
  const mintToTokenAccountInfo = useSelector(tokenAccountSelector).mintToTokenAccountInfo;
  const swapKeyToLpUser = useSelector(lpUserSelector).swapKeyToLp;

  const pythState = useSelector(pythSelector);
  const symbolToPythData = pythState.symbolToPythData;
  const { connected: isConnectedWallet } = useWallet();

  const tvl = useMemo(() => {
    if (poolConfigs.length > 0) {
      return (poolConfigs as any).reduce((sum, poolConfig) => {
        const swapInfo = poolState.swapKeyToSwapInfo[poolConfig.swapInfo];
        const { basePrice, quotePrice } = getPythMarketPrice(symbolToPythData, poolConfig);

        let volumn = new BigNumber(0);
        if (basePrice && quotePrice && swapInfo) {
          const baseDecimals = poolConfig.baseTokenInfo.decimals;
          const quoteDecimals = poolConfig.quoteTokenInfo.decimals;
          const baseTvl = getTokenTvl(
            swapInfo.poolState.baseReserve.toNumber(),
            baseDecimals,
            basePrice,
          );
          const quoteTvl = getTokenTvl(
            swapInfo.poolState.quoteReserve.toNumber(),
            quoteDecimals,
            quotePrice,
          );
          volumn = baseTvl.plus(quoteTvl);
        }
        return sum.plus(volumn);
      }, new BigNumber(0)) as BigNumber;
    }
    return new BigNumber(0);
  }, [symbolToPythData, poolState]);

  const poolConfigsWithDeposit = poolConfigs.filter((poolConfig) =>
    hasDeposit(mintToTokenAccountInfo, swapKeyToLpUser, poolConfig),
  );
  const poolConfigsWithoutDeposit = poolConfigs.filter(
    (poolConfig) => !hasDeposit(mintToTokenAccountInfo, swapKeyToLpUser, poolConfig),
  );

  return (
    <Page>
      <Box className={classes.container}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" color="textPrimary" align="center">
            Pools
          </Typography>
          <Typography align="center" color="textPrimary">
            Total Value Locked: {convertDollar(tvl.toFixed(2))}
          </Typography>
        </Box>
        <br />
        {isConnectedWallet && (
          <Box className={classes.listContainer}>
            <Typography>Your Pools</Typography>
            <Box mt={3.5}>
              {poolConfigsWithDeposit.map((poolConfig) => (
                <PoolCard isUserPool key={poolConfig.swapInfo} poolConfig={poolConfig} />
              ))}
            </Box>
          </Box>
        )}
        <Box className={classes.listContainer} mt={isConnectedWallet ? 4 : 0}>
          {isConnectedWallet && (
            <Box mb={3.5}>
              <Typography>Other Pools</Typography>
            </Box>
          )}
          {poolConfigs.length > 0 && (
            <Box className={classes.poolCardContainer}>
              {poolConfigsWithoutDeposit.map((poolConfig) => (
                <Box key={poolConfig.swapInfo}>
                  <PoolCard poolConfig={poolConfig} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Page>
  );
};

export default Home;
