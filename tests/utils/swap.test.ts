import {
  calculatePriceImpact,
  generateResultFromAmountOut,
  getSwapOutAmountSellBase,
  getSwapOutAmountSellQuote,
  getSwapOutAmount,
} from "../../src/utils/swap";

import { Fees } from "../../src/lib/state";

import BigNumber from "bignumber.js";

describe("utils/swap", function () {
  it("calculatePriceImpact", function () {
    calculatePriceImpact(
      new BigNumber(100_000),
      new BigNumber(200_000),
      new BigNumber(13),
      new BigNumber(27.5),
      new BigNumber(0.5),
      {
        adminTradeFeeNumerator: BigInt(1),
        adminTradeFeeDenominator: BigInt(2),
      } as Fees
    );
    
  });
});
