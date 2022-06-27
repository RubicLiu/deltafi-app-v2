import {
  Box,
  //   Container,
  Divider,
  Grid,
  makeStyles,
  Tab,
  Theme,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
// import { useWallet } from "@solana/wallet-adapter-react";

import { TabContext, TabList, TabPanel } from "@mui/lab";
import Page from "components/layout/Page";
import {
  DELTAFI_TOKEN_DECIMALS,
  getPoolConfigByFarmKey,
  PoolConfig,
  poolConfigs,
} from "constants/deployConfigV2";
import PoolCard from "views/Pool/components/Card";
import FarmCard from "views/Farm/components/Card";
import { ChangeEvent, useCallback, useMemo } from "react";
import Reward from "views/Reward";
import { MintToTokenAccountInfo } from "states/accounts/tokenAccount";
import { useDispatch, useSelector } from "react-redux";
import {
  lpUserSelector,
  tokenAccountSelector,
  poolSelector,
  pythSelector,
  deltafiUserSelector,
  selectGateIoSticker,
  dashboardViewSelector,
  farmUserSelector,
  farmSelector,
  rewardViewSelector,
} from "states/selectors";
import { useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import { getPythMarketPrice } from "states/accounts/pythAccount";
import { calculateWithdrawalFromShares } from "lib/calc";
import { formatCurrencyAmount } from "utils/utils";
import { CircularProgress } from "@material-ui/core";
import { dashboardViewActions } from "states/views/dashboardView";
import { calculateFarmPoolsStakeInfo } from "views/Farm/utils";
import { PoolCardColor } from "utils/type";
import { exponentiatedBy } from "calculations/utils";
import { anchorBnToBn, stringCutDecimals } from "utils/tokenUtils";
import { SECONDS_PER_YEAR } from "constants/index";
import { rewardViewActions } from "states/views/rewardView";
import BN from "bn.js";

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
  return lpUser && (lpUser.baseShare > 0 || lpUser.quoteShare > 0);
}

const useStyles = makeStyles(({ breakpoints, palette, spacing }: Theme) => ({
  container: {
    width: "100%",
    flex: 1,
    marginBottom: spacing(2),
  },
  poolCardContainer: {
    marginBottom: spacing(2),
    marginLeft: "auto",
    marginRight: "auto",
    "&:last-child": {
      marginBottom: 0,
    },
    maxWidth: 630,
    [breakpoints.up("md")]: {
      maxWidth: 945,
    },
    [breakpoints.up("lg")]: {
      maxWidth: 1260,
    },
    [breakpoints.up("xl")]: {
      maxWidth: 1890,
    },
  },
  header: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    lineHeight: 1,
    alignItems: "center",
    backgroundImage: "url('/images/banner/main.png')",
    backgroundColor: palette.background.primary,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: 120,
  },
  values: {
    display: "flex",
    width: "100%",
    height: "100%",
    background: "#1c1c1c",
    borderRadius: "inherit",
    "& .MuiDivider-vertical": {
      width: 2,
    },
    "& .MuiDivider-root": {
      [breakpoints.down("md")]: {
        height: 2,
      },
    },
    [breakpoints.down("md")]: {
      flexDirection: "column",
    },
  },
  valuesCt: {
    marginTop: spacing(2),
    marginBottom: spacing(2),
    padding: 1,
    borderRadius: 10,
    background: "linear-gradient(111.31deg, #d4ff00 15.34%, #bdff00 95.74%)",
  },
  divider: {
    background: palette.gradient.cta,
  },
  value: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: 80,
    width: 230,
  },
  tabContext: {
    "& .MuiTabs-indicator": {
      height: 2,
      background: "linear-gradient(111.31deg, #D4FF00 15.34%, #BDFF00 95.74%)",
    },
    "& .Mui-selected": {
      color: "#d4ff00",
    },
    "& .MuiTab-textColorInherit": {
      opacity: 1,
    },
    "& .MuiTab-wrapper": {
      textTransform: "none",
    },
    [breakpoints.up("md")]: {
      padding: "0 24px",
    },
  },
  tabDivider: {
    position: "absolute",
    height: 1,
    width: "calc(100% - 48px)",
    opacity: 0.4,
    background: "linear-gradient(111.31deg, #D4FF00 15.34%, #BDFF00 95.74%)",
    transform: "translate(0, -100%)",
    [breakpoints.down("md")]: {
      left: 24,
    },
  },
  tabPanel: {
    "&.MuiTabPanel-root": {
      padding: 0,
    },
  },
}));

const Home: React.FC = (props) => {
  const classes = useStyles(props);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();

  const handleChange = useCallback(
    (newValue: string) => {
      dispatch(dashboardViewActions.setSelectedTab({ selectedTab: newValue }));
    },
    [dispatch],
  );

  const { connected: isConnectedWallet } = useWallet();
  const mintToTokenAccountInfo = useSelector(tokenAccountSelector).mintToTokenAccountInfo;
  const swapKeyToLpUser = useSelector(lpUserSelector).swapKeyToLp;

  const poolConfigsWithDeposit = useMemo(
    () =>
      poolConfigs.filter((poolConfig) =>
        hasDeposit(mintToTokenAccountInfo, swapKeyToLpUser, poolConfig),
      ),
    [mintToTokenAccountInfo, swapKeyToLpUser],
  );

  const deltafiPrice = useSelector(selectGateIoSticker("DELFI_USDT"));

  const swapKeyToSwapInfo = useSelector(poolSelector).swapKeyToSwapInfo;
  const symbolToPythPriceData = useSelector(pythSelector).symbolToPythPriceData;
  const deltafiUser = useSelector(deltafiUserSelector);
  const dashboardView = useSelector(dashboardViewSelector);
  const rewardView = useSelector(rewardViewSelector);
  const isFarmUserFetched = useSelector(farmUserSelector).fetched;
  const farmPoolKeyToFarmUser = useSelector(farmUserSelector).farmPoolKeyToFarmUser;
  const farmKeyToFarmInfo = useSelector(farmSelector).farmKeyToFarmInfo;

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

    const rawResult = depositAmount
      .multipliedBy(apr)
      .multipliedBy(currentTs - lastUpdateTs)
      .dividedBy(SECONDS_PER_YEAR);

    if (rawResult.isLessThan(exponentiatedBy("1", DELTAFI_TOKEN_DECIMALS))) {
      return new BigNumber(0);
    }

    return new BigNumber(rawResult.toFixed(DELTAFI_TOKEN_DECIMALS));
  };

  const userFarmPoolsData = useMemo(
    () =>
      calculateFarmPoolsStakeInfo(
        poolConfigsWithDeposit,
        swapKeyToSwapInfo,
        symbolToPythPriceData,
        deltafiPrice,
        farmKeyToFarmInfo,
        farmPoolKeyToFarmUser,
      ),
    [
      symbolToPythPriceData,
      farmPoolKeyToFarmUser,
      swapKeyToSwapInfo,
      deltafiPrice,
      farmKeyToFarmInfo,
      poolConfigsWithDeposit,
    ],
  );

  // extract swap and referral rewards from deltafi user account
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

    // if deltafiUser's data is set is null explicitly
    // it means there is no reward yet and the data should be set to 0
    if (deltafiUser?.user === null) {
      return {
        owedRewardFromSwap: "0",
        owedRewardFromReferral: "0",
        totalRewardFromSwap: "0",
        totalRewardFromReferral: "0",
      };
    }

    // i
    return {
      owedRewardFromSwap: "--",
      owedRewardFromReferral: "--",
      totalRewardFromSwap: "--",
      totalRewardFromReferral: "--",
    };
  }, [deltafiUser]);

  // farmPoolToReward records user's rewards in each pool
  // userUnclaimedFarmRewards is user's unclaimed rewards up till now
  // userTotalFarmRewards is the rewards amount that have been claimed by the user
  // these values are passed into reward component
  const { userUnclaimedFarmRewards, userTotalFarmRewards } = useMemo(() => {
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
      const poolConfig = getPoolConfigByFarmKey(farmPoolKey);
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
      const untrackedBaseRewards = getUntrackedReward(
        rewardView.rewardRefreshTs,
        farmUser.basePosition.lastUpdateTs.toNumber(),
        farmUser.basePosition.nextClaimTs.toNumber(),
        baseApr,
        anchorBnToBn(poolConfig.baseTokenInfo, farmUser.basePosition.depositedAmount),
      );

      const claimedBaseRewards = exponentiatedBy(
        farmUser.basePosition.cumulativeInterest.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );

      const owedQuoteRewards = exponentiatedBy(
        farmUser.quotePosition.rewardsOwed.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );
      const untrackedQuoteRewards = getUntrackedReward(
        rewardView.rewardRefreshTs,
        farmUser.quotePosition.lastUpdateTs.toNumber(),
        farmUser.quotePosition.nextClaimTs.toNumber(),
        quoteApr,
        anchorBnToBn(poolConfig.quoteTokenInfo, farmUser.quotePosition.depositedAmount),
      );

      const claimedQuoteRewards = exponentiatedBy(
        farmUser.quotePosition.cumulativeInterest.toString(),
        DELTAFI_TOKEN_DECIMALS,
      );

      const untrackedRewards =
        untrackedBaseRewards.isEqualTo(0) || untrackedQuoteRewards.isEqualTo(0)
          ? new BigNumber(0)
          : untrackedBaseRewards.plus(untrackedQuoteRewards);
      const unclaimedFarmRewards = stringCutDecimals(
        DELTAFI_TOKEN_DECIMALS,
        owedBaseRewards
          .plus(owedQuoteRewards)
          .plus(untrackedRewards)
          .toFixed(DELTAFI_TOKEN_DECIMALS),
      );
      const totalFarmRewards = stringCutDecimals(
        DELTAFI_TOKEN_DECIMALS,
        claimedBaseRewards.plus(claimedQuoteRewards).toFixed(DELTAFI_TOKEN_DECIMALS),
      );

      userUnclaimedFarmRewards = userUnclaimedFarmRewards.plus(unclaimedFarmRewards);
      userTotalFarmRewards = userTotalFarmRewards.plus(totalFarmRewards);

      farmPoolToRewards[farmPoolKey] = { unclaimedFarmRewards, totalFarmRewards };
    }

    // update to rewardview
    dispatch(rewardViewActions.setFarmPoolRewardsInfo({ farmPoolToRewards }));
    return {
      userUnclaimedFarmRewards: hasFarmUser
        ? stringCutDecimals(
            DELTAFI_TOKEN_DECIMALS,
            userUnclaimedFarmRewards.toFixed(DELTAFI_TOKEN_DECIMALS),
          )
        : "0",
      userTotalFarmRewards: hasFarmUser
        ? stringCutDecimals(
            DELTAFI_TOKEN_DECIMALS,
            userTotalFarmRewards.toFixed(DELTAFI_TOKEN_DECIMALS),
          )
        : "0",
    };
  }, [farmPoolKeyToFarmUser, farmKeyToFarmInfo, rewardView.rewardRefreshTs, dispatch]);

  const { totalHoldings, isLoadingTotalHoldings } = useMemo(() => {
    if (!isConnectedWallet) {
      return { totalHoldings: null, isLoadingTotalHoldings: false };
    }

    if (Object.keys(swapKeyToSwapInfo).length === 0 || Object.keys(swapKeyToLpUser).length === 0) {
      // when wallet is connected, but lp or swapinfo are not fetched yet
      return { totalHoldings: null, isLoadingTotalHoldings: true };
    }

    if (poolConfigs.length > 0) {
      const totalHoldings = (poolConfigs as PoolConfig[]).reduce((res, poolConfig) => {
        const swapInfo = swapKeyToSwapInfo[poolConfig.swapInfo];
        const lpUser = swapKeyToLpUser[poolConfig.swapInfo];
        if (!lpUser || !swapInfo) {
          return res;
        }

        const { basePrice, quotePrice } = getPythMarketPrice(symbolToPythPriceData, poolConfig);
        const { baseWithdrawalAmount: baseAmount, quoteWithdrawalAmount: quoteAmount } =
          calculateWithdrawalFromShares(
            lpUser.baseShare,
            lpUser.quoteShare,
            poolConfig.baseTokenInfo,
            poolConfig.quoteTokenInfo,
            basePrice,
            quotePrice,
            swapInfo?.poolState,
          );

        let volumn = new BigNumber(0);
        if (basePrice && quotePrice && swapInfo) {
          const baseValue = new BigNumber(baseAmount).multipliedBy(basePrice);
          const quoteValue = new BigNumber(quoteAmount).multipliedBy(quotePrice);

          volumn = baseValue.plus(quoteValue);
        }
        return res.plus(volumn);
      }, new BigNumber(0)) as BigNumber;

      return { totalHoldings, isLoadingTotalHoldings: false };
    }
    return { totalHoldings: new BigNumber(0), isLoadingTotalHoldings: false };
  }, [symbolToPythPriceData, swapKeyToSwapInfo, swapKeyToLpUser, isConnectedWallet]);

  const { totalRewards, isLoadingTotalRewards } = useMemo(() => {
    if (!isConnectedWallet) {
      return { totalRewards: null, isLoadingTotalRewards: false };
    }

    if (
      !deltafiUser.fetched ||
      !isFarmUserFetched ||
      !deltafiPrice ||
      userTotalFarmRewards === "--" ||
      totalRewardFromSwap === "--" ||
      totalRewardFromReferral === "--"
    ) {
      // when wallet is connected, but deltafiUser is not fetched yet
      return { totalRewards: null, isLoadingTotalRewards: true };
    }

    const totalRewards = new BigNumber(userTotalFarmRewards)
      .plus(totalRewardFromSwap)
      .plus(totalRewardFromReferral);

    return {
      totalRewards,
      isLoadingTotalRewards: false,
    };
  }, [
    deltafiUser,
    isConnectedWallet,
    deltafiPrice,
    isFarmUserFetched,
    userTotalFarmRewards,
    totalRewardFromSwap,
    totalRewardFromReferral,
  ]);

  const headerData = [
    {
      label: "My Total Holdings",
      color: "#d4ff00",
      value: formatCurrencyAmount(totalHoldings),
      isLoading: isLoadingTotalHoldings,
    },
    {
      label: "My Total Rewards",
      color: "#03f2a0",
      value: formatCurrencyAmount(totalRewards),
      isLoading: isLoadingTotalRewards,
    },
    // TODO: add 24hr performance
    // { label: "24hr Performance", color: "#693eff", value: "$212(9%)" },
  ];

  // colors for the farmcards
  const cardColors: PoolCardColor[] = useMemo(
    () => ["greenYellow", "lime", "indigo", "dodgerBlue"],
    [],
  );

  return (
    <Page>
      <Box padding={0} className={classes.container}>
        <Box color="#fff" textAlign="center" className={classes.header}>
          <Box className={classes.valuesCt}>
            <Box className={classes.values}>
              {headerData.map((data, idx) => (
                <Box display="flex" key={idx} flexDirection={matches ? "column" : "row"}>
                  <Box className={classes.value} key={data.label}>
                    <Box fontSize={14} fontWeight={400} lineHeight="18px">
                      {data.label}
                    </Box>
                    <Box
                      mt={0.5}
                      lineHeight="28px"
                      fontSize={20}
                      fontWeight={600}
                      color={data.color}
                    >
                      {data.isLoading ? <CircularProgress size={25} color="inherit" /> : data.value}
                    </Box>
                  </Box>
                  {idx === headerData.length - 1 || (
                    <Divider
                      orientation={matches ? "horizontal" : "vertical"}
                      flexItem
                      className={classes.divider}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Box className={classes.tabContext}>
          <TabContext value={dashboardView.selectedTab}>
            <Box sx={{ borderBottom: 1, color: "#fff" }}>
              <TabList
                onChange={(event: ChangeEvent<{}>, value: any) => {
                  handleChange(value);
                }}
                centered
                aria-label="dashboard tabs"
              >
                <Tab label="My Pools" value="pool" />

                <Tab label="My Farms" value="farm" />
                <Tab label="Invite & Earn" value="reward" />
              </TabList>
            </Box>
            <Divider className={classes.tabDivider} />

            <TabPanel value="pool" className={classes.tabPanel}>
              <>
                {isConnectedWallet && (
                  <Grid container className={classes.poolCardContainer} justifyContent="center">
                    {poolConfigsWithDeposit.length > 0 &&
                      poolConfigsWithDeposit.map((poolConfig: PoolConfig, idx) => (
                        <Grid item key={idx} xl={2} lg={3} md={4} sm={6}>
                          <PoolCard
                            isUserPool={true}
                            color={cardColors[idx % 4]}
                            key={poolConfig.swapInfo}
                            poolConfig={poolConfig}
                          />
                        </Grid>
                      ))}
                  </Grid>
                )}
              </>
            </TabPanel>
            <TabPanel value="farm" className={classes.tabPanel}>
              {isConnectedWallet && (
                <Grid container className={classes.poolCardContainer} justifyContent="center">
                  {userFarmPoolsData.map(
                    ({ farmInfoAddress, totalStaked, userStaked, apr, poolConfig }, idx) => (
                      <Grid item key={idx} xl={2} lg={3} md={4} sm={6}>
                        <FarmCard
                          color={cardColors[idx % 4]}
                          key={farmInfoAddress}
                          poolConfig={poolConfig}
                          farmInfoAddress={farmInfoAddress}
                          totalStaked={totalStaked}
                          userStaked={userStaked}
                          apr={apr}
                          isUserPool
                        />
                      </Grid>
                    ),
                  )}
                </Grid>
              )}
            </TabPanel>
            <TabPanel value="reward" className={classes.tabPanel}>
              <Reward
                userUnclaimedFarmRewards={userUnclaimedFarmRewards}
                userTotalFarmRewards={userTotalFarmRewards}
                totalRewardFromSwap={totalRewardFromSwap}
                owedRewardFromSwap={owedRewardFromSwap}
                totalRewardFromReferral={totalRewardFromReferral}
                owedRewardFromReferral={owedRewardFromReferral}
              />
            </TabPanel>
          </TabContext>
        </Box>
      </Box>
    </Page>
  );
};

export default Home;
