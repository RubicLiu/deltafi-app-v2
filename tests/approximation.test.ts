import { approximateOutAmount, approximateUpperBoundK } from "../src/lib/calc/approximation";
import BigNumber from "bignumber.js";

describe("approximation", function () {
  it("approximateUpperBoundK", function () {
    expect(approximateUpperBoundK(new BigNumber(100_000_000_000), new BigNumber(1000), 2))
      // 1.00000000000000030000000204 from contract's unit test
      .toEqual(new BigNumber("1.00000000000000030001"));

    expect(approximateUpperBoundK(new BigNumber(1_000_333_000_000), new BigNumber(666666666), 3))
      // 1.00000266726725809421318062 from contract's unit test
      .toEqual(new BigNumber("1.00000266726725809425"));
  });

  it("approximateOutAmount", function () {
    expect(
      approximateOutAmount(
        new BigNumber(1_000_000_000_000_000),
        new BigNumber(2_500_000_000_000_000),
        new BigNumber(20_000_000_000),
        new BigNumber(55_000_000_000),
        new BigNumber(3),
        new BigNumber(1000),
      ),
    ).toEqual({
      impliedOutAmount: 2727,
      approximationResult: 2727,
    });

    expect(
      approximateOutAmount(
        new BigNumber(1_000_111_000),
        new BigNumber(2_000_777_000_000),
        new BigNumber(20_000),
        new BigNumber(55_000_000),
        new BigNumber(3100),
        new BigNumber(111_111_111),
      ),
    ).toEqual({
      impliedOutAmount: 250574557690,
      approximationResult: 178083509594,
    });

    expect(
      approximateOutAmount(
        new BigNumber(1_000_000),
        new BigNumber(1_220_000),
        new BigNumber(20_000),
        new BigNumber(20_000),
        new BigNumber(1),
        new BigNumber(1_000_000),
      ),
    ).toEqual({
      impliedOutAmount: 1_220_000,
      approximationResult: 0,
    });

    expect(
      approximateOutAmount(
        new BigNumber(1_500_000),
        new BigNumber(1_500_000),
        new BigNumber(18_000),
        new BigNumber(20_000),
        new BigNumber(1),
        new BigNumber(1_420_000),
      ),
    ).toEqual({
      impliedOutAmount: 1_278_000,
      approximationResult: 0,
    });
  });
});
