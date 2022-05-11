import React, { ReactElement } from "react";
import { Box, Grid, Link, makeStyles, Theme } from "@material-ui/core";

import Page from "components/layout/Page";
import Card from "./components/Card_v2";
import { PoolConfig, poolConfigs } from "constants/deployConfigV2";
import ShareIcon from "components/Svg/icons/ShareIcon";

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
}));

const Home: React.FC = (props): ReactElement => {
  const classes = useStyles(props);

  return (
    <Page>
      <Box className={classes.container}>
        <Box color="#fff" textAlign="center" className={classes.header}>
          <Box marginTop={1} fontSize={16}>
            DeltaFi Liquidity Mining
          </Box>
          <Box fontSize={58} color="#D4FF00" fontWeight={600}>
            Coming Soon
          </Box>
          <Box marginTop={1.5} fontSize={18}>
            Last DELFI Price
          </Box>
          <Box display="flex" alignItems="end" mt={1}>
            <Link href="https://www.gate.io/trade/DELFI_USDT" underline="always">
              Read more about DLT
            </Link>
            <Box ml={0.5} height={16} width={16}>
              <ShareIcon />
            </Box>
          </Box>
        </Box>
        {poolConfigs.length && (
          <Grid container className={classes.poolCardContainer} justifyContent="center">
            {poolConfigs.map((poolConfig: PoolConfig, idx) => (
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
                  key={poolConfig.farmInfo}
                  poolConfig={poolConfig}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Page>
  );
};

export default Home;
