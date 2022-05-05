import {
  calculatePriceImpact,
  generateResultFromAmountOut,
  getSwapOutAmountSellBase,
  getSwapOutAmountSellQuote,
  getSwapOutAmount,
} from "../../src/utils/swap";

import { PoolInfo } from "../../src/providers/types";
import { TokenConfig } from "../../src/constants/deployConfig";
import { PoolState, SwapConfig, SwapInfo, SwapType } from "../../src/anchor/type_definitions";

import BigNumber from "bignumber.js";
import { Keypair, PublicKey } from "@solana/web3.js";

import * as anchor from "@project-serum/anchor";

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
          adminTradeFeeNumerator: new anchor.BN(1),
          adminTradeFeeDenominator: new anchor.BN(2),
        } as SwapConfig,
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
          adminTradeFeeNumerator: new anchor.BN(1),
          adminTradeFeeDenominator: new anchor.BN(3),
        } as SwapConfig,
      ),
    ).toEqual(new BigNumber("0.0408163265306122449"));
  });

  it("generateResultFromAmountOut", function () {
    expect(
      generateResultFromAmountOut(
        new BigNumber(100_000),
        new BigNumber(200_000),
        1000,
        2003,
        0.5, // 0.5%
        {
          adminTradeFeeNumerator: new anchor.BN(1),
          adminTradeFeeDenominator: new anchor.BN(2),
          tradeFeeNumerator: new anchor.BN(6),
          tradeFeeDenominator: new anchor.BN(2003),
        } as SwapConfig,
      ),
    ).toEqual({
      amountIn: 1000,
      amountOut: 1997,
      amountOutWithSlippage: 1987.015,
      fee: 6,
      priceImpact: 0.02020202020202020202,
    });

    expect(
      generateResultFromAmountOut(
        new BigNumber(200_000),
        new BigNumber(100_000),
        4000,
        2006,
        1, // 1%
        {
          adminTradeFeeNumerator: new anchor.BN(1),
          adminTradeFeeDenominator: new anchor.BN(3),
          tradeFeeNumerator: new anchor.BN(9),
          tradeFeeDenominator: new anchor.BN(2006),
        } as SwapConfig,
      ),
    ).toEqual({
      amountIn: 4000,
      amountOut: 1997,
      amountOutWithSlippage: 1977.03,
      fee: 9,
      priceImpact: 0.0408163265306122449,
    });
  });

  it("getSwapOutAmountSellBase", function () {
    expect(
      getSwapOutAmountSellBase(
        {
          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(100_000_000_000),
            quoteReserve: new anchor.BN(20_000_000_000),
          } as PoolState,
        } as SwapInfo,
        new BigNumber(2_000_000),
        new BigNumber(0.163),
      ),
    ).toEqual(325_994);

    expect(
      getSwapOutAmountSellBase(
        {
          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(123_001_000),
            quoteReserve: new anchor.BN(23_321_001),
          } as PoolState,
        } as SwapInfo,
        new BigNumber(12_550_000),
        new BigNumber(0.163),
      ),
    ).toEqual(1_775_380);

    expect(
      getSwapOutAmountSellBase(
        {
          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(111_101_001_000),
            targetQuoteReserve: new anchor.BN(501_000_000),
            baseReserve: new anchor.BN(234_134_100_352_634),
            quoteReserve: new anchor.BN(1_201_003_000_001),
          } as PoolState,
        } as SwapInfo,
        new BigNumber(200_001_000),
        new BigNumber(0.00523),
      ),
    ).toEqual(1_189_852);

    expect(
      getSwapOutAmountSellBase(
        {
          swapType: { stableSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(100_000_000),
            baseReserve: new anchor.BN(100_000_000),
            quoteReserve: new anchor.BN(100_000_000),
          } as PoolState,
          swapConfig: {
            slope: new anchor.BN("500000000000000000"),
          } as SwapConfig,
        } as SwapInfo,

        new BigNumber(200_000),
        new BigNumber(1),
      ),
    ).toEqual(199_800);
  });

  it("getSwapOutAmountSellQuote", function () {
    expect(
      getSwapOutAmountSellQuote(
        {
          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(100_000_000_000 + 2_000_000),
            quoteReserve: new anchor.BN(20_000_000_000 - 325_994),
          } as PoolState,
        } as SwapInfo,
        new BigNumber(325_994),
        new BigNumber(0.163),
      ),
    ).toEqual(1_999_999); // less than 2_000_000 due to the floorings

    expect(
      getSwapOutAmountSellQuote(
        {
          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(123_001_000 + 12_550_000),
            quoteReserve: new anchor.BN(23_321_001 - 1_775_380),
          } as PoolState,
        } as SwapInfo,
        new BigNumber(1_775_380),
        new BigNumber(0.163),
      ),
    ).toEqual(12_549_997); // less than 12_550_000 due to the floorings

    expect(
      getSwapOutAmountSellQuote(
        {
          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(111_101_001_000),
            targetQuoteReserve: new anchor.BN(501_000_000),
            baseReserve: new anchor.BN(234_134_100_352_634 + 200_001_000),
            quoteReserve: new anchor.BN(1_201_003_000_001 - 1_189_852),
          } as PoolState,
        } as SwapInfo,
        new BigNumber(1_189_852),
        new BigNumber(0.00523),
      ),
    ).toEqual(200_000_918); // less than 200_001_000 due to the floorings

    expect(
      getSwapOutAmountSellQuote(
        {
          swapType: { stableSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(100_000_000),
            baseReserve: new anchor.BN(100_000_000 + 200_000),
            quoteReserve: new anchor.BN(100_000_000 - 199_800),
          } as PoolState,
          swapConfig: {
            slope: new anchor.BN("500000000000000000"),
          } as SwapConfig,
        } as SwapInfo,
        new BigNumber(199_800),
        new BigNumber(1),
      ),
    ).toEqual(199_999); // less than 200_000 due to the floorings
  });

  it("getSwapOutAmount", function () {
    const baseMintPublicKey: PublicKey = new Keypair().publicKey;
    const quoteMintPublicKey: PublicKey = new Keypair().publicKey;

    // normal swap, sell base, disable confidence interval
    expect(
      getSwapOutAmount(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,

          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(100_000_000_000),
            quoteReserve: new anchor.BN(20_000_000_000),
          } as PoolState,
          swapConfig: {
            enableConfidenceInterval: false,
            adminTradeFeeNumerator: new anchor.BN(1),
            adminTradeFeeDenominator: new anchor.BN(2),
            tradeFeeNumerator: new anchor.BN(1994),
            tradeFeeDenominator: new anchor.BN(325_994),
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
        } as TokenConfig,
        "2000000",
        0.5,
        new BigNumber(0.163),
      ),
    ).toEqual({
      amountIn: 2000000,
      amountOut: 324000,
      amountOutWithSlippage: 322380,
      fee: 1994,
      priceImpact: 0.00003625043906419723,
    });

    // normal swap, sell base, enable confidence interval
    expect(
      getSwapOutAmount(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,

          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(100_000_000_000),
            quoteReserve: new anchor.BN(20_000_000_000),
          } as PoolState,
          swapConfig: {
            enableConfidenceInterval: true,
            adminTradeFeeNumerator: new anchor.BN(1),
            adminTradeFeeDenominator: new anchor.BN(2),
            tradeFeeNumerator: new anchor.BN(1994),
            tradeFeeDenominator: new anchor.BN(325_994),
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
        } as TokenConfig,
        "2000000",
        0.5,
        new BigNumber(0.164),
        new BigNumber(0.163),
        new BigNumber(0.165),
      ),
    ).toEqual({
      amountIn: 2000000,
      amountOut: 324000,
      amountOutWithSlippage: 322380,
      fee: 1994,
      priceImpact: 0.00003625043906419723,
    });

    // normal swap, sell quote, disable confidence interval
    expect(
      getSwapOutAmount(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,

          swapType: { normalSwap: {} } as SwapType,
          poolState: {
            targetBaseReserve: new anchor.BN(100_000_000),
            targetQuoteReserve: new anchor.BN(20_000_000),
            baseReserve: new anchor.BN(100_000_000_000 + 2000000),
            quoteReserve: new anchor.BN(20_000_000_000 - 325_994),
          } as PoolState,
          swapConfig: {
            enableConfidenceInterval: false,
            adminTradeFeeNumerator: new anchor.BN(1),
            adminTradeFeeDenominator: new anchor.BN(2),
            tradeFeeNumerator: new anchor.BN(9999),
            tradeFeeDenominator: new anchor.BN(1999999),
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: quoteMintPublicKey.toBase58(),
        } as TokenConfig,
        {
          mint: baseMintPublicKey.toBase58(),
        } as TokenConfig,
        "325994",
        1,
        new BigNumber(0.163),
      ),
    ).toEqual({
      amountIn: 325_994,
      amountOut: 1990000,
      amountOutWithSlippage: 1970100,
      fee: 9999,
      priceImpact: 0.00003625028487116887,
    });

    // normal swap, sell quote, disable confidence interval
    expect(() =>
      getSwapOutAmount(
        {
          base: baseMintPublicKey,
          quote: quoteMintPublicKey,
        } as PoolInfo,
        {
          mint: "duummy-key",
        } as TokenConfig,
        {
          mint: baseMintPublicKey.toBase58(),
        } as TokenConfig,
        "200000",
        1,
        new BigNumber(1),
      ),
    ).toThrow();
  });
});
