import { ReactElement, useMemo } from "react";
import useCollapse from "react-collapsed";
import { Box, makeStyles } from "@material-ui/core";
import { TokenConfig } from "constants/deployConfigV2";
import BigNumber from "bignumber.js";
import { SwapInfo } from "anchor/type_definitions";
import { WAD } from "constants/index";
import { stringCutDecimals } from "utils/tokenUtils";
import { Avatar } from "@mui/material";
import { convertDollarSign, currencyValueDisplay } from "utils/utils";

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

const PoolStatsCollapsible = ({
  baseTokenInfo,
  quoteTokenInfo,
  baseReserve,
  quoteReserve,
  tvl,
  swapInfo,
  hidden,
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
    <Box className="collapsible" hidden={hidden}>
      <Box className={classes.clickable} {...getToggleProps()}>
        {isExpanded ? "Details" : "Details ..."}
      </Box>
      <Box {...getCollapseProps()}>
        <Box className="content">
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>Currency Reserves:</Box>
            <Box textAlign={"right"}>
              <Box display={"flex"} justifyContent={"space-between"}>
                <Box>
                  {currencyValueDisplay(baseReserve.toFixed(0))} {baseTokenInfo.symbol}
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
                  {currencyValueDisplay(quoteReserve.toFixed(0))} {quoteTokenInfo.symbol}{" "}
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
            <Box textAlign={"right"}>{convertDollarSign(tvl.toFixed(2))}</Box>
          </Box>
          <Box className={classes.dataRow}>
            <Box textAlign={"left"}>Reserve Magnifier:</Box>
            <Box textAlign={"right"}>{`${stringCutDecimals(2, reserveManifier.toString())}x`}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PoolStatsCollapsible;
