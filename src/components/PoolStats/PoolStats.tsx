import { ReactElement, useMemo } from "react";
import useCollapse from "react-collapsed";
import { Box, Link, makeStyles } from "@material-ui/core";
import { PoolConfig, TokenConfig } from "constants/deployConfigV2";
import BigNumber from "bignumber.js";
import { SwapInfo } from "anchor/type_definitions";
import { WAD } from "constants/index";
import { stringCutDecimals } from "utils/tokenUtils";
import { Avatar } from "@mui/material";

const useStyles = makeStyles(({ breakpoints, palette, spacing }) => ({
  clickable: {
    cursor: "pointer",
  },
  dataRow: {
    display: "flex",
    justifyContent: "space-between",
  },
}));

export type PoolStatsDataFeed = {
  baseTokenInfo: TokenConfig;
  quoteTokenInfo: TokenConfig;
  baseReserve: BigNumber;
  quoteReserve: BigNumber;
  tvl: BigNumber;
  swapInfo: SwapInfo;
  hidden: boolean;
};

const addressLink = (address: string, link: string) => {
  return address.length < 8 ? address : `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const PoolStatsCollapsible = ({
  baseTokenInfo,
  quoteTokenInfo,
  baseReserve,
  quoteReserve,
  tvl,
  swapInfo,
}: PoolStatsDataFeed): ReactElement => {
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();
  const classes = useStyles();

  const reserveManifier = useMemo(() => {
    if (swapInfo.swapType.normalSwap) {
      return new BigNumber(swapInfo.swapConfig.virtualReservePercentage.toString())
        .dividedBy(100)
        .plus(1);
    } else if (swapInfo.swapType.stableSwap) {
      // TODO?: change this after slope field is changed
      const slope = new BigNumber(swapInfo.swapConfig.slope.toString()).dividedBy(WAD);
      return new BigNumber(1).minus(slope).dividedBy(slope).plus(1);
    }
  }, [swapInfo]);

  return (
    <Box className="collapsible">
      <Box className={classes.clickable} {...getToggleProps()}>
        {isExpanded ? "Details" : "Details ..."}
      </Box>
      <Box {...getCollapseProps()}>
        <Box className="content">
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>Currency Reserves:</Box>
            <Box textAlign={"right"}>
              <Box display={"flex"}>
                <Box>
                  {baseReserve.toFixed(0)} {baseTokenInfo.symbol}
                </Box>
                <Avatar
                  sx={{
                    height: 20,
                    width: 20,
                  }}
                  src={baseTokenInfo.logoURI}
                />
              </Box>
              <Box display={"flex"}>
                <Box>
                  {quoteReserve.toFixed(0)} {quoteTokenInfo.symbol}{" "}
                </Box>
                <Avatar
                  sx={{
                    height: 20,
                    width: 20,
                  }}
                  src={quoteTokenInfo.logoURI}
                />
              </Box>
            </Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>Total Reserve:</Box>
            <Box textAlign={"right"}>{tvl.toFixed(0)}</Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>Reserve Magnifier:</Box>
            <Box textAlign={"right"}>{`${stringCutDecimals(2, reserveManifier.toString())}x`}</Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>Swap Account:</Box>
            <Box textAlign={"right"}>{`${stringCutDecimals(2, reserveManifier.toString())}x`}</Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>{baseTokenInfo.symbol} Address:</Box>
            <Box textAlign={"right"} className={classes.clickable}>
              <Link
                onClick={() =>
                  window.open(`https://solscan.io/token/${swapInfo.mintBase.toBase58()}`)
                }
              >
                {addressLink(swapInfo.mintBase.toBase58(), "")}
              </Link>
            </Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>{quoteTokenInfo.symbol} Address:</Box>
            <Box textAlign={"right"} className={classes.clickable}>
              <Link
                onClick={() =>
                  window.open(`https://solscan.io/token/${swapInfo.mintQuote.toBase58()}`)
                }
              >
                {addressLink(swapInfo.mintQuote.toBase58(), "")}
              </Link>
            </Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>{baseTokenInfo.symbol} Reserve:</Box>
            <Box textAlign={"right"} className={classes.clickable}>
              <Link
                onClick={() =>
                  window.open(`https://solscan.io/account/${swapInfo.tokenBase.toBase58()}`)
                }
              >
                {addressLink(swapInfo.tokenBase.toBase58(), "")}
              </Link>
            </Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>{quoteTokenInfo.symbol} Reserve:</Box>
            <Box textAlign={"right"} className={classes.clickable}>
              <Link
                onClick={() =>
                  window.open(`https://solscan.io/account/${swapInfo.tokenQuote.toBase58()}`)
                }
              >
                {addressLink(swapInfo.tokenQuote.toBase58(), "")}
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PoolStatsCollapsible;
