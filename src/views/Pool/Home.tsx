import { useMemo } from "react";
import { Backdrop, Box, Grid, makeStyles, Modal } from "@material-ui/core";

import Page from "components/layout/Page";
import Card from "./components/Card_v2";
import { convertDollar, formatCurrencyAmount } from "utils/utils";
import { poolConfigs } from "constants/deployConfigV2";
import { useSelector } from "react-redux";
import { pythSelector, poolSelector } from "states/selectors";
import { useParams } from "react-router";
import Deposit from "views/Deposit/Deposit";
import { calculateTotalHoldings } from "lib/calc/pools";

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  container: {
    width: "100%",
    flex: 1,
    marginBottom: spacing(2),
  },
  backdrop: {
    background: "rgba(0,0,0,0.8)",
  },
  paper: {
    backgroundColor: palette.background.primary,
    margin: spacing(2),
    padding: `${spacing(3)}px ${spacing(2)}px`,
    borderRadius: spacing(2),
    [breakpoints.up("sm")]: {
      borderRadius: spacing(3),
      padding: `${spacing(5)}px ${spacing(4)}px`,
      minWidth: 380,
    },
    outline: "none",
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
    height: 120,
  },
}));

const Home: React.FC = () => {
  const classes = useStyles();

  const poolState = useSelector(poolSelector);
  const pythState = useSelector(pythSelector);
  const symbolToPythPriceData = pythState.symbolToPythPriceData;
  const params = useParams<{ poolAddress?: string }>();
  const poolAddress = params?.poolAddress;

  const tvl = useMemo(
    () => calculateTotalHoldings(poolConfigs, poolState.swapKeyToSwapInfo, symbolToPythPriceData),
    [symbolToPythPriceData, poolState],
  );

  return (
    <Page>
      <Box padding={0} className={classes.container}>
        <Box color="#fff" textAlign="center" className={classes.header}>
          <Box fontSize={36} color="#D4FF00" fontWeight={600}>
            {formatCurrencyAmount(tvl)}
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
      {poolAddress && (
        <Modal
          open
          closeAfterTransition
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            flexWrap: "wrap",
          }}
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
            classes: { root: classes.backdrop },
          }}
        >
          <Box className={classes.paper}>
            <Deposit poolAddress={poolAddress} />
          </Box>
        </Modal>
      )}
    </Page>
  );
};

export default Home;
