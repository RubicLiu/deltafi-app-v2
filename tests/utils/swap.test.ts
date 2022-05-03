import {
  calculatePriceImpact,
  generateResultFromAmountOut,
  getSwapOutAmountSellBase,
  getSwapOutAmountSellQuote,
  getSwapOutAmount,
} from "../../src/utils/swap";

import { Fees, PoolState, SwapType } from "../../src/lib/state";

import BigNumber from "bignumber.js";

describe("utils/swap", function () {
  it("calculatePriceImpact", function () {
    expect(
      calculatePriceImpact(
        new BigNumber(100_000),
        new BigNumber(200_000),
        new BigNumber(1000),
        new BigNumber(2003),
        new BigNumber(6),
        {
          adminTradeFeeNumerator: BigInt(1),
          adminTradeFeeDenominator: BigInt(2),
        } as Fees,
      ),
    ).toEqual(new BigNumber("0.02020202020202020202"));

    expect(
      calculatePriceImpact(
        new BigNumber(200_000),
        new BigNumber(100_000),
        new BigNumber(4000),
        new BigNumber(2006),
        new BigNumber(9),
        {
          adminTradeFeeNumerator: BigInt(1),
          adminTradeFeeDenominator: BigInt(3),
        } as Fees,
      ),
    ).toEqual(new BigNumber("0.0408163265306122449"));
  });

  it("calculatePriceImpact", function () {
    expect(
      calculatePriceImpact(
        new BigNumber(100_000),
        new BigNumber(200_000),
        new BigNumber(1000),
        new BigNumber(2003),
        new BigNumber(6),
        {
          adminTradeFeeNumerator: BigInt(1),
          adminTradeFeeDenominator: BigInt(2),
        } as Fees,
      ),
    ).toEqual(new BigNumber("0.02020202020202020202"));

    expect(
      calculatePriceImpact(
        new BigNumber(200_000),
        new BigNumber(100_000),
        new BigNumber(4000),
        new BigNumber(2006),
        new BigNumber(9),
        {
          adminTradeFeeNumerator: BigInt(1),
          adminTradeFeeDenominator: BigInt(3),
        } as Fees,
      ),
    ).toEqual(new BigNumber("0.0408163265306122449"));
  });

  it("getSwapOutAmountSellBase", function () {
    expect(
      getSwapOutAmountSellBase(
        {
          baseTarget: new BigNumber(100_000_000),
          quoteTarget: new BigNumber(20_000_000),
          baseReserve: new BigNumber(100_000_000_000),
          quoteReserve: new BigNumber(20_000_000_000),
        } as PoolState,
        new BigNumber(2_000_000),
        new BigNumber(0.163),
        SwapType.Normal,
      ),
    ).toEqual(325_994);
    
    expect(
      getSwapOutAmountSellBase(
        {
          baseTarget: new BigNumber(100_000_000),
          quoteTarget: new BigNumber(20_000_000),
          baseReserve: new BigNumber(123_001_000),
          quoteReserve: new BigNumber(23_321_001),
        } as PoolState,
        new BigNumber(12_550_000),
        new BigNumber(0.163),
        SwapType.Normal,
      ),
    ).toEqual(1_775_380);

    expect(
      getSwapOutAmountSellBase(
        {
          baseTarget: new BigNumber(111_101_001_000),
          quoteTarget: new BigNumber(501_000_000),
          baseReserve: new BigNumber(234_134_100_352_634),
          quoteReserve: new BigNumber(1_201_003_000_001),
        } as PoolState,
        new BigNumber(200_001_000),
        new BigNumber(0.00523),
        SwapType.Normal,
      ),
    ).toEqual(1_189_852);
  });

  it("getSwapOutAmountSellQuote", function () {
    expect(
      getSwapOutAmountSellQuote(
        {
          baseTarget: new BigNumber(100_000_000),
          quoteTarget: new BigNumber(20_000_000),
          baseReserve: new BigNumber(100_000_000_000 + 2_000_000),
          quoteReserve: new BigNumber(20_000_000_000 - 325_994),
        } as PoolState,
        new BigNumber(325_994),
        new BigNumber(0.163),
        SwapType.Normal,
      ),
    ).toEqual(1_999_999); // less than 2_000_000 due to the floorings

    expect(
      getSwapOutAmountSellQuote(
        {
          baseTarget: new BigNumber(100_000_000),
          quoteTarget: new BigNumber(20_000_000),
          baseReserve: new BigNumber(123_001_000 + 12_550_000),
          quoteReserve: new BigNumber(23_321_001 - 1_775_380),
        } as PoolState,
        new BigNumber(1_775_380),
        new BigNumber(0.163),
        SwapType.Normal,
      ),
    ).toEqual(12_549_997); // less than 12_550_000 due to the floorings
    
    expect(
      getSwapOutAmountSellQuote(
        {
          baseTarget: new BigNumber(111_101_001_000),
          quoteTarget: new BigNumber(501_000_000),
          baseReserve: new BigNumber(234_134_100_352_634 + 200_001_000),
          quoteReserve: new BigNumber(1_201_003_000_001 - 1_189_852),
        } as PoolState,
        new BigNumber(1_189_852),
        new BigNumber(0.00523),
        SwapType.Normal,
      ),
    ).toEqual(200_000_918); // less than 200_001_000 due to the floorings
  });
});
