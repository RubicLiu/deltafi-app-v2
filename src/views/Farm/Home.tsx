import React, { ChangeEvent, ReactElement, useCallback, useMemo, useState } from "react";
import { Box, Grid, makeStyles, Theme } from "@material-ui/core";

import Page from "components/layout/Page";
import FarmCard from "./components/Card";
import { poolConfigs } from "constants/deployConfigV2";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Divider, Tab } from "@mui/material";
import { useSelector } from "react-redux";
import { farmSelector, poolSelector, pythSelector, selectGateIoSticker } from "states";
import { calculateFarmPoolsStakeInfo, FarmInfoData } from "./utils";
import BigNumber from "bignumber.js";
import { PoolCardColor } from "utils/type";
import { formatCurrencyAmount } from "utils/utils";

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
  title: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: 500,
    color: "#FFFFFF",
    marginBottom: spacing(2),
    [breakpoints.up("sm")]: {
      fontSize: 21,
    },
  },
  link: {
    fontSize: 12,
    fontWeight: 500,
    marginLeft: spacing(1),
    [breakpoints.up("sm")]: {
      fontSize: 18,
      fontWeight: 500,
    },
  },
  linkIcon: {
    marginLeft: spacing(1),
    width: 12,
    height: 12,
    [breakpoints.up("sm")]: {
      width: 16,
      height: 16,
    },
  },
  descContainer: {
    border: "2px solid #3E3E3E",
    padding: spacing(2),
    borderRadius: spacing(2),
    textAlign: "center",
    [breakpoints.up("sm")]: {
      padding: spacing(4),
      borderRadius: spacing(3),
      marginBottom: spacing(3),
    },
  },
  description: {
    fontSize: 12,
    lineHeight: "18px",
    fontWeight: 400,
    color: "#F6F6F6",
    [breakpoints.up("sm")]: {
      fontSize: 14,
      lineHeight: "21px",
      fontWeight: 500,
    },
  },
  list: {
    background: palette.background.primary,
    borderRadius: spacing(2),
    marginBottom: spacing(2),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    [breakpoints.up("sm")]: {
      padding: `${spacing(5)}px ${spacing(4)}px`,
      borderRadius: spacing(3),
    },
  },
  iconGroup: {
    display: "flex",
    alignItems: "center",
    marginRight: spacing(2),
  },
  coinIcon: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    boxShadow: "rgb(0 0 0 / 8%) 0px 6px 10px",
    color: "rgb(86, 90, 105)",
  },
  firstCoin: {
    marginRight: -5,
    zIndex: 1,
  },
  yourFarms: {
    backgroundColor: palette.background.primary,
    borderRadius: 24,
    padding: spacing(4),
    marginBottom: spacing(2),
  },
  yourFarmsCard: {
    backgroundColor: palette.background.secondary,
    padding: spacing(3),
    borderRadius: 24,
    marginBottom: spacing(4),
    marginTop: spacing(2),
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
    height: 120,
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
  tabPanel: {
    "&.MuiTabPanel-root": {
      padding: 0,
    },
  },
}));

const Home: React.FC = (props): ReactElement => {
  const classes = useStyles(props);
  const [tab, setTab] = useState("active");

  const deltafiPrice = useSelector(selectGateIoSticker("DELFI_USDT"));
  const farmKeyToFarmInfo = useSelector(farmSelector).farmKeyToFarmInfo;

  const symbolToPythPriceData = useSelector(pythSelector).symbolToPythPriceData;
  const swapKeyToSwapInfo = useSelector(poolSelector).swapKeyToSwapInfo;

  // parse all farm pools' data using the util function
  const fullFarmPoolsStakeInfo = useMemo(
    () =>
      calculateFarmPoolsStakeInfo(
        poolConfigs,
        swapKeyToSwapInfo,
        symbolToPythPriceData,
        deltafiPrice,
        farmKeyToFarmInfo,
      ),
    [symbolToPythPriceData, swapKeyToSwapInfo, farmKeyToFarmInfo, deltafiPrice],
  );

  // filter out active and inactive farms
  const { activeFarms, inactiveFarms } = useMemo(() => {
    const activeFarms: FarmInfoData[] = [];
    const inactiveFarms: FarmInfoData[] = [];

    fullFarmPoolsStakeInfo.forEach((farmInfoData) => {
      const farmConfig = farmKeyToFarmInfo[farmInfoData.farmInfoAddress]?.farmConfig;
      if (farmConfig && !farmConfig.isPaused) {
        activeFarms.push(farmInfoData);
      } else {
        inactiveFarms.push(farmInfoData);
      }
    });
    return { activeFarms, inactiveFarms };
  }, [fullFarmPoolsStakeInfo, farmKeyToFarmInfo]);

  const totalStaked = useMemo(() => {
    let result = new BigNumber(0);
    // sum up total staked value of each pool
    // if any of the pool has a nan value which means the data is not available
    // the final result will be nan
    fullFarmPoolsStakeInfo.forEach((farmPoolsData) => {
      result = result.plus(farmPoolsData.totalStaked);
    });
    return result;
  }, [fullFarmPoolsStakeInfo]);

  // colors for the farmcards
  const farmCardColors: PoolCardColor[] = useMemo(
    () => ["greenYellow", "lime", "indigo", "dodgerBlue"],
    [],
  );

  // map a list of farm info data to a set of FarmCard react components
  const farmInfoDataListToFarmCards = useCallback(
    (farmInfoDataList: FarmInfoData[]) => (
      <Grid container className={classes.poolCardContainer} justifyContent="center">
        {farmInfoDataList.map(
          ({ farmInfoAddress, totalStaked, userStaked, apr, poolConfig }, idx) => (
            <Grid item key={idx} xl={2} lg={3} md={4} sm={6}>
              <FarmCard
                color={farmCardColors[idx % 4]}
                poolConfig={poolConfig}
                farmInfoAddress={farmInfoAddress}
                totalStaked={totalStaked}
                userStaked={userStaked}
                apr={apr}
              />
            </Grid>
          ),
        )}
      </Grid>
    ),
    [classes, farmCardColors],
  );

  return (
    <Page>
      <Box className={classes.container}>
        <Box color="#fff" textAlign="center" className={classes.header}>
          <Box fontSize={36} color="#D4FF00" fontWeight={600}>
            {formatCurrencyAmount(totalStaked)}
          </Box>
          <Box marginTop={1.5} fontSize={18}>
            Total Staked
          </Box>
        </Box>
        <Box className={classes.tabContext}>
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, color: "#fff" }}>
              <TabList
                onChange={(event: ChangeEvent<{}>, value: any) => {
                  setTab(value);
                }}
                centered
                aria-label="dashboard tabs"
              >
                <Tab
                  sx={{
                    color: "#fff",
                    "&.Mui-selected": { color: "#BDFF00" },
                    padding: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "Poppins",
                    textTransform: "none",
                  }}
                  label="Active Farms"
                  value="active"
                />
                <Tab
                  sx={{
                    color: "#fff",
                    "&.Mui-selected": { color: "#BDFF00" },
                    padding: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "Poppins",
                    textTransform: "none",
                    marginLeft: 6,
                  }}
                  label="Inactive Farms"
                  value="inactive"
                />
              </TabList>
            </Box>
            <Divider
              sx={{
                border: "none",
                background: "linear-gradient(111.31deg, #D4FF00 15.34%, #BDFF00 95.74%)",
                height: "1px",
                opacity: 0.4,
              }}
            />
            <TabPanel value="active" className={classes.tabPanel}>
              {farmInfoDataListToFarmCards(activeFarms)}
            </TabPanel>
            <TabPanel value="inactive" className={classes.tabPanel}>
              {farmInfoDataListToFarmCards(inactiveFarms)}
            </TabPanel>
          </TabContext>
        </Box>
      </Box>
    </Page>
  );
};

export default Home;
