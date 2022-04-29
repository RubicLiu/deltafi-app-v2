import {
    calculateOutAmountNormalSwapInternal,
} from "../src/lib/calc/calculation";
import BigNumber from "bignumber.js";

describe("calculation", function () {
it("calculateOutAmountNormalSwapInternal", function () {
  expect(
    Math.floor(
      calculateOutAmountNormalSwapInternal(
        new BigNumber(0.163),
        new BigNumber(100_000_000),
        new BigNumber(20_000_000),
        new BigNumber(123_001_000),
        new BigNumber(23_321_001),
        new BigNumber(12_550_000),
      ).toNumber(),
    ),
  ).toEqual(1775380);

  expect(
    Math.floor(
      calculateOutAmountNormalSwapInternal(
        new BigNumber(0.163),
        new BigNumber(100_000_000),
        new BigNumber(20_000_000),
        new BigNumber(100_000_000_000),
        new BigNumber(20_000_000_000),
        new BigNumber(2_000_000),
      ).toNumber(),
    ),
  ).toEqual(325994);

  expect(
    Math.floor(
      calculateOutAmountNormalSwapInternal(
        new BigNumber(0.00523),
        new BigNumber(111_101_001_000),
        new BigNumber(501_000_000),
        new BigNumber(234_134_100_352_634),
        new BigNumber(1_201_003_000_001),
        new BigNumber(200_001_000),
      ).toNumber(),
    ),
  ).toEqual(1189852);

  expect(
    Math.floor(
      calculateOutAmountNormalSwapInternal(
        new BigNumber(3),
        new BigNumber(20_000_000_000),
        new BigNumber(55_000_000_000),
        new BigNumber(1_000_000_000_000_000_000),
        new BigNumber(2_500_000_000_000_000_000),
        new BigNumber(1000),
      ).toNumber(),
    ),
  ).toEqual(2500);
});
});
