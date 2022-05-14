import { useMemo } from "react";
import { Box, Grid, makeStyles } from "@material-ui/core";
import BigNumber from "bignumber.js";

import Page from "components/layout/Page";
import Card from "./components/Card_v2";
import { convertDollar, getTokenTvl } from "utils/utils";
import { poolConfigs } from "constants/deployConfigV2";
import { useSelector } from "react-redux";
import { pythSelector, poolSelector } from "states/selectors";
import { getPythMarketPrice } from "states/accounts/pythAccount";

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  container: {
    width: "100%",
    flex: 1,
    marginBottom: spacing(2),
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
    height: 200,
  },
}));

const Home: React.FC = () => {
  const classes = useStyles();

  const poolState = useSelector(poolSelector);

  const pythState = useSelector(pythSelector);
  const symbolToPythData = pythState.symbolToPythData;

  const tvl = useMemo(() => {
    if (poolConfigs.length > 0) {
      return (poolConfigs as any).reduce((sum, poolConfig) => {
        const swapInfo = poolState.swapKeyToSwapInfo[poolConfig.swapInfo];
        const { basePrice, quotePrice } = getPythMarketPrice(symbolToPythData, poolConfig);

        let volumn = new BigNumber(0);
        if (basePrice && quotePrice && swapInfo) {
          const baseTvl = getTokenTvl(
            poolConfig.baseTokenInfo,
            swapInfo.poolState.baseReserve,
            basePrice,
          );
          const quoteTvl = getTokenTvl(
            poolConfig.quoteTokenInfo,
            swapInfo.poolState.quoteReserve,
            quotePrice,
          );
          volumn = baseTvl.plus(quoteTvl);
        }
        return sum.plus(volumn);
      }, new BigNumber(0)) as BigNumber;
    }
    return new BigNumber(0);
  }, [symbolToPythData, poolState]);

  return (
    <Page>
      <Box padding={0} className={classes.container}>
        <Box color="#fff" textAlign="center" className={classes.header}>
          <Box fontSize={58} color="#D4FF00" fontWeight={600}>
            {convertDollar(tvl.toFixed(2))}
          </Box>
          <Box marginTop={1} fontSize={18}>
            Total Value Locked
          </Box>
        </Box>

        {poolConfigs.length > 0 && (
          <Grid container className={classes.poolCardContainer} justifyContent="center">
            {poolConfigs.map((poolConfig, idx) => (
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
                  key={poolConfig.swapInfo}
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
