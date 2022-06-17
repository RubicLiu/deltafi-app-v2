import React, { ChangeEvent, ReactElement, useState } from "react";
import { Box, Grid, Link, makeStyles, Theme } from "@material-ui/core";

import Page from "components/layout/Page";
import Card from "./components/Card";
import { PoolConfig, poolConfigs } from "constants/deployConfigV2";
import ShareIcon from "components/Svg/icons/ShareIcon";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Divider, Tab } from "@mui/material";
import { useSelector } from "react-redux";
import { farmSelector, selectGateIoSticker } from "states";

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
    height: 200,
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
  const farmKeyToFarmInfo = useSelector(farmSelector);

  return (
    <Page>
      <Box className={classes.container}>
        <Box color="#fff" textAlign="center" className={classes.header}>
          <Box fontSize={58} color="#D4FF00" fontWeight={600}>
            {`$${deltafiPrice?.last || "--"}`}
          </Box>
          <Box marginTop={1.5} fontSize={18}>
            Last DELFI Price
          </Box>
          <Box display="flex" alignItems="end" mt={1}>
            <Link
              onClick={() => window.open("https://www.gate.io/trade/DELFI_USDT")}
              underline="always"
            >
              Read more about DELFI
            </Link>
            <Box ml={0.5} height={16} width={16}>
              <ShareIcon />
            </Box>
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
              {poolConfigs.length && (
                <Grid container className={classes.poolCardContainer} justifyContent="center">
                  {poolConfigs.map((poolConfig: PoolConfig, idx) =>
                    poolConfig?.farmInfoList
                      .filter((farm) => !farmKeyToFarmInfo[farm.farmInfo]?.farmConfig?.isPaused)
                      .map((farm) => (
                        <Grid item key={idx} xl={2} lg={3} md={4} sm={6}>
                          <Card
                            color={
                              idx % 4 === 0
                                ? "greenYellow"
                                : idx % 4 === 1
                                ? "lime"
                                : idx % 4 === 2
                                ? "indigo"
                                : "dodgerBlue"
                            }
                            key={farm.farmInfo}
                            poolConfig={poolConfig}
                            farmInfoAddress={farm.farmInfo}
                          />
                        </Grid>
                      )),
                  )}
                </Grid>
              )}
            </TabPanel>
            <TabPanel value="inactive" className={classes.tabPanel}>
              {poolConfigs.length && (
                <Grid container className={classes.poolCardContainer} justifyContent="center">
                  {poolConfigs.map((poolConfig: PoolConfig, idx) =>
                    poolConfig?.farmInfoList
                      .filter((farm) => farmKeyToFarmInfo[farm.farmInfo]?.farmConfig?.isPaused)
                      .map((farm) => (
                        <Grid item key={idx} xl={2} lg={3} md={4} sm={6}>
                          <Card
                            color={
                              idx % 4 === 0
                                ? "greenYellow"
                                : idx % 4 === 1
                                ? "lime"
                                : idx % 4 === 2
                                ? "indigo"
                                : "dodgerBlue"
                            }
                            key={farm.farmInfo}
                            poolConfig={poolConfig}
                            farmInfoAddress={farm.farmInfo}
                          />
                        </Grid>
                      )),
                  )}
                </Grid>
              )}
            </TabPanel>
          </TabContext>
        </Box>
      </Box>
    </Page>
  );
};

export default Home;
