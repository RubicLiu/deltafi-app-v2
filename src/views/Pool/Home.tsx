import { useMemo } from "react";
import { Box, makeStyles, Typography } from "@material-ui/core";
import { useWallet } from "@solana/wallet-adapter-react";
import { PriceData } from "@pythnetwork/client";
import BigNumber from "bignumber.js";

import Page from "components/layout/Page";
import PoolCard from "./components/Card";
import { PoolSchema } from "constants/pools";
import { convertDoller } from "utils/utils";
import { usePools } from "providers/pool";
import { PMM } from "lib/calc";
import usePyth from "providers/pyth";
import { useTokenAccounts } from "providers/tokens";
import { useCustomConnection } from "providers/connection";

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
  const { schemas, pools } = usePools();
  const [tokens] = useTokenAccounts();

  const { symbolMap } = usePyth();
  const { connected: isConnectedWallet } = useWallet();
  const { network } = useCustomConnection();
  const isMainnet = network === "mainnet-beta";
  const tvl = useMemo(() => {
    if (pools.length > 0) {
      return (pools as any).reduce((p, c) => {
        const pmm = new PMM(c.poolState);
        const baseSymbol = `${!isMainnet ? "Crypto." : ""}${c.baseTokenInfo.symbol.toUpperCase()}/USD`;
        const quoteSymbol = `${!isMainnet ? "Crypto." : ""}${c.quoteTokenInfo.symbol.toUpperCase()}/USD`;
        let volumn = new BigNumber(0);
        if (symbolMap[baseSymbol] && symbolMap[quoteSymbol]) {
          const basePrice = ((symbolMap[baseSymbol] as any).price as PriceData).price
            ? ((symbolMap[baseSymbol] as any).price as PriceData).price
            : ((symbolMap[baseSymbol] as any).price as PriceData).previousPrice;
          const baseDecimals = ((symbolMap[baseSymbol] as any).price as PriceData).exponent;
          const quotePrice = ((symbolMap[quoteSymbol] as any).price as PriceData).price
            ? ((symbolMap[quoteSymbol] as any).price as PriceData).price
            : ((symbolMap[quoteSymbol] as any).price as PriceData).previousPrice;
          const quoteDecimals = ((symbolMap[quoteSymbol] as any).price as PriceData).exponent;

          volumn = pmm.tvl(basePrice, quotePrice, baseDecimals, quoteDecimals);
        }
        return p.plus(volumn);
      }, new BigNumber(0)) as BigNumber;
    }
    return new BigNumber(0);
  }, [pools, isMainnet, symbolMap]);

  return (
    <Page>
      <Box className={classes.container}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" color="textPrimary" align="center">
            Pools
          </Typography>
          <Typography align="center" color="textPrimary">
            TVL {convertDoller(tvl.toString())}
          </Typography>
        </Box>
        <br />
        {isConnectedWallet && (
          <Box className={classes.listContainer}>
            <Typography>Your Pools</Typography>
            <Box mt={3.5}>
              {schemas
                .filter((schema) =>
                  tokens?.find((token) => token.effectiveMint.toBase58() === schema.mintAddress.toBase58()),
                )
                .map((schema) => (
                  <PoolCard isUserPool key={schema.address.toString()} poolKey={schema.address} />
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
          {schemas.length > 0 && (
            <Box className={classes.poolCardContainer}>
              {schemas
                .filter(
                  (schema) =>
                    !tokens?.find((token) => token.effectiveMint.toBase58() === schema.mintAddress.toBase58()),
                )
                .map((schema: PoolSchema) => (
                  <Box key={schema.address.toString()}>
                    <PoolCard poolKey={schema.address} />
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
