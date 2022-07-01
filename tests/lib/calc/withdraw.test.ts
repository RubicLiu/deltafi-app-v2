import {
  calculateWithdrawalFromShares,
  calculateWithdrawFromSharesAndBalances,
} from "../../../src/calculations/calculation";
import BigNumber from "bignumber.js";
import BN from "bn.js";

describe("withdraw", function () {
  it("calculateWithdrawFromSharesAndBalances", function () {
    expect(
      calculateWithdrawFromSharesAndBalances(
        {
          price: new BigNumber(1),
          share: new BigNumber(100),
          shareSupply: new BigNumber(1000),
          reserve: new BigNumber(1000),
          targetReserve: new BigNumber(2000),
        },
        {
          price: new BigNumber(1),
          share: new BigNumber(100),
          shareSupply: new BigNumber(1000),
          reserve: new BigNumber(1000),
          targetReserve: new BigNumber(2000),
        },
      ),
    ).toEqual({
      lowTokenAmount: new BigNumber(100),
      highTokenAmount: new BigNumber(100),
    });

    expect(
      calculateWithdrawFromSharesAndBalances(
        {
          price: new BigNumber(1),
          share: new BigNumber(100),
          shareSupply: new BigNumber(1000),
          reserve: new BigNumber(1000),
          targetReserve: new BigNumber(4000),
        },
        {
          price: new BigNumber(4),
          share: new BigNumber(200),
          shareSupply: new BigNumber(1000),
          reserve: new BigNumber(1000),
          targetReserve: new BigNumber(2000),
        },
      ),
    ).toEqual({
      lowTokenAmount: new BigNumber(100),
      highTokenAmount: new BigNumber(190),
    });
  });

  it("calculateWithdrawalFromShares", function () {
    expect(
      calculateWithdrawalFromShares(
        new BN(100),
        new BN(200),
        { decimals: 6 },
        { decimals: 6 },
        new BigNumber(1),
        new BigNumber(4),
        {
          baseReserve: new BN(1000),
          targetBaseReserve: new BN(4000),
          baseSupply: new BN(1000),
          quoteReserve: new BN(1000),
          targetQuoteReserve: new BN(2000),
          quoteSupply: new BN(1000),
        },
      ),
    ).toEqual({
      baseWithdrawalAmount: "0.0001",
      quoteWithdrawalAmount: "0.00019",
    });

    expect(
      calculateWithdrawalFromShares(
        new BN(200),
        new BN(100),
        { decimals: 6 },
        { decimals: 6 },
        new BigNumber(4),
        new BigNumber(1),
        {
          baseReserve: new BN(1000),
          targetBaseReserve: new BN(2000),
          baseSupply: new BN(1000),
          quoteReserve: new BN(1000),
          targetQuoteReserve: new BN(4000),
          quoteSupply: new BN(1000),
        },
      ),
    ).toEqual({
      baseWithdrawalAmount: "0.00019",
      quoteWithdrawalAmount: "0.0001",
    });
  });
});
