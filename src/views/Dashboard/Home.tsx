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
import { PoolConfig, poolConfigs } from "constants/deployConfigV2";
import PoolCard from "views/Pool/components/Card_v2";
import { ChangeEvent, useMemo, useState } from "react";
import Reward from "views/Reward";
import { MintToTokenAccountInfo } from "states/accounts/tokenAccount";
import { useSelector } from "react-redux";
import {
  lpUserSelector,
  tokenAccountSelector,
  poolSelector,
  pythSelector,
  deltafiUserSelector,
  selectGateIoSticker,
} from "states/selectors";
import { useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import { getPythMarketPrice } from "states/accounts/pythAccount";
import { calculateWithdrawalFromShares } from "lib/calc";
import { formatCurrencyAmount } from "utils/utils";
import { exponentiatedBy } from "utils/decimal";
import { DELTAFI_TOKEN_DECIMALS } from "constants/deployConfigV2";
import { CircularProgress } from "@material-ui/core";

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
  const [tab, setTab] = useState("reward");
  const handleChange = (newValue: string) => {
    setTab(newValue);
  };
  const { connected: isConnectedWallet } = useWallet();
  const mintToTokenAccountInfo = useSelector(tokenAccountSelector).mintToTokenAccountInfo;
  const swapKeyToLpUser = useSelector(lpUserSelector).swapKeyToLp;

  const poolConfigsWithDeposit = poolConfigs.filter((poolConfig) =>
    hasDeposit(mintToTokenAccountInfo, swapKeyToLpUser, poolConfig),
  );

  const deltafiPrice = useSelector(selectGateIoSticker("DELFI_USDT"));

  const swapKeyToSwapInfo = useSelector(poolSelector).swapKeyToSwapInfo;
  const symbolToPythData = useSelector(pythSelector).symbolToPythData;
  const deltafiUser = useSelector(deltafiUserSelector);

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

        const { basePrice, quotePrice } = getPythMarketPrice(symbolToPythData, poolConfig);
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
  }, [symbolToPythData, swapKeyToSwapInfo, isConnectedWallet]);

  const { totalRewards, isLoadingTotalRewards } = useMemo(() => {
    // TODO(leqiang): Add farm rewards
    if (!isConnectedWallet) {
      return { totalRewards: null, isLoadingTotalRewards: false };
    }
    console.log(deltafiUser);
    if (!deltafiUser.fetched || !deltafiPrice) {
      // when wallet is connected, but deltafiUser is not fetched yet
      return { totalRewards: null, isLoadingTotalRewards: true };
    }
    if (!deltafiUser.user) {
      return { totalRewards: new BigNumber(0), isLoadingTotalRewards: false };
    }

    const totalDelfiAmount = exponentiatedBy(
      new BigNumber(
        deltafiUser.user.claimedReferralRewards
          .add(deltafiUser.user.claimedTradeRewards)
          .add(deltafiUser.user.owedReferralRewards)
          .add(deltafiUser.user.owedTradeRewards)
          .toString(),
      ),
      DELTAFI_TOKEN_DECIMALS,
    );

    const totalRewards = totalDelfiAmount.multipliedBy(deltafiPrice.last);

    console.log("res", totalRewards.toString());
    return {
      totalRewards,
      isLoadingTotalRewards: false,
    };
  }, [deltafiUser, isConnectedWallet, deltafiPrice]);

  const headerData = [
    {
      label: "Total Holdings",
      color: "#d4ff00",
      value: formatCurrencyAmount(totalHoldings),
      isLoading: isLoadingTotalHoldings,
    },
    {
      label: "Total Rewards",
      color: "#03f2a0",
      value: formatCurrencyAmount(totalRewards),
      isLoading: isLoadingTotalRewards,
    },
    // TODO: add 24hr performance
    // { label: "24hr Performance", color: "#693eff", value: "$212(9%)" },
  ];

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
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, color: "#fff" }}>
              <TabList
                onChange={(event: ChangeEvent<{}>, value: any) => {
                  handleChange(value);
                }}
                centered
                aria-label="dashboard tabs"
              >
                <Tab label="My Pools" value="pool" />
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
                            color={
                              idx % 4 === 0
                                ? "greenYellow"
                                : idx % 4 === 1
                                ? "lime"
                                : idx % 4 === 2
                                ? "indigo"
                                : "dodgerBlue"
                            }
                            key={poolConfig.swapInfo}
                            poolConfig={poolConfig}
                          />
                        </Grid>
                      ))}
                  </Grid>
                )}
              </>
            </TabPanel>
            <TabPanel value="reward" className={classes.tabPanel}>
              <Reward />
            </TabPanel>
          </TabContext>
        </Box>
      </Box>
    </Page>
  );
};

export default Home;
