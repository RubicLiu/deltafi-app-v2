import {
    calculateBalancedReservesStableSwap,
    calculateOutAmountStableSwapInternal,
} from "../src/lib/calc/calculation";
import BigNumber from "bignumber.js";

describe("calculation", function () {
it("calculateBalancedReservesStableSwap", function () {
  expect(
    calculateBalancedReservesStableSwap(
      new BigNumber(100),
      new BigNumber(100_000_000),
      new BigNumber(10_000_000_000),
      new BigNumber(0.5),
    ),
  ).toEqual({
    balancedReserveA: new BigNumber(100000000),
    balancedReserveB: new BigNumber(10000000000),
  });

  expect(
    calculateBalancedReservesStableSwap(
      new BigNumber(0.01),
      new BigNumber(10_000_000_000),
      new BigNumber(100_000_000),
      new BigNumber(0.5),
    ),
  ).toEqual({
    balancedReserveA: new BigNumber(10000000000),
    balancedReserveB: new BigNumber(100000000),
  });

  expect(
    calculateBalancedReservesStableSwap(
      new BigNumber(1),
      new BigNumber(10_000_000_000),
      new BigNumber(10_000_000_000),
      new BigNumber(0.5),
    ),
  ).toEqual({
    balancedReserveA: new BigNumber(10000000000),
    balancedReserveB: new BigNumber(10000000000),
  });
});

it("calculateOutAmountStableSwapInternal", function () {
  expect(
    Math.floor(
      calculateOutAmountStableSwapInternal(
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(200_000),
        new BigNumber(0.5),
      ).toNumber(),
    ),
  ).toEqual(199800);

  expect(
    Math.floor(
      calculateOutAmountStableSwapInternal(
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(2_000),
        new BigNumber(0.5),
      ).toNumber(),
    ),
  ).toEqual(1999);

  expect(
    Math.floor(
      calculateOutAmountStableSwapInternal(
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(200_000),
        new BigNumber(0.2),
      ).toNumber(),
    ),
  ).toEqual(199920);

  expect(
    Math.floor(
      calculateOutAmountStableSwapInternal(
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(200_000),
        new BigNumber(0.8),
      ).toNumber(),
    ),
  ).toEqual(199680);

  expect(
    Math.floor(
      calculateOutAmountStableSwapInternal(
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(100_000_000),
        new BigNumber(0.5),
      ).toNumber(),
    ),
  ).toEqual(66666666);
});
});