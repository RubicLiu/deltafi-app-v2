import {
  getNormalizedReserves,
  getSwapInResult,
  getSwapOutAmountSellBase,
  getSwapOutAmountSellQuote,
  getSwapOutResult,
} from "../../src/utils/swap";

import { PoolInfo } from "../../src/providers/types";
import { TokenConfig } from "../../src/constants/deployConfig";
import { PoolState, SwapConfig, SwapInfo, SwapType } from "../../src/anchor/type_definitions";

import BigNumber from "bignumber.js";
import { Keypair, PublicKey } from "@solana/web3.js";

import * as anchor from "@project-serum/anchor";

describe("utils/swap", function () {
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
            marketPrice: new anchor.BN("1000000000000000000"), // 1
          } as PoolState,
          swapConfig: {
            slope: new anchor.BN("500000000000000000"), // 0.5
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
            marketPrice: new anchor.BN("1000000000000000000"), // 1
          } as PoolState,
          swapConfig: {
            slope: new anchor.BN("500000000000000000"), // 0.5
          } as SwapConfig,
        } as SwapInfo,
        new BigNumber(199_800),
        new BigNumber(1),
      ),
    ).toEqual(199_999); // less than 200_000 due to the floorings
  });

  it("getSwapOutResult", function () {
    const baseMintPublicKey: PublicKey = new Keypair().publicKey;
    const quoteMintPublicKey: PublicKey = new Keypair().publicKey;

    // normal swap, sell base, disable confidence interval
    expect(
      getSwapOutResult(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,
          mintBaseDecimals: 6,
          mintQuoteDecimals: 6,
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
            minReserveLimitPercentage: 0,
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        "2.000000",
        0.5,
        new BigNumber(0.163),
      ),
    ).toEqual({
      amountOut: "0.324",
      amountOutWithSlippage: "0.322380",
      fee: "0.001994",
      priceImpact: "0.00001840490797546012",
      insufficientLiquidity: false,
    });

    // normal swap, sell base, enable confidence interval
    expect(
      getSwapOutResult(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,
          mintBaseDecimals: 9,
          mintQuoteDecimals: 6,
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
            minReserveLimitPercentage: 0,
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
          decimals: 9,
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        "0.002000000",
        0.5,
        new BigNumber(164),
        new BigNumber(163),
        new BigNumber(165),
      ),
    ).toEqual({
      amountOut: "0.324",
      amountOutWithSlippage: "0.322380",
      fee: "0.001994",
      priceImpact: "0.00001840490797546012",
      insufficientLiquidity: false,
    });

    // normal swap, sell quote, disable confidence interval
    expect(
      getSwapOutResult(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,
          mintBaseDecimals: 6,
          mintQuoteDecimals: 6,
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
            minReserveLimitPercentage: 0,
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: quoteMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        {
          mint: baseMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        "0.325994",
        1,
        new BigNumber(0.163),
      ),
    ).toEqual({
      amountOut: "1.99",
      amountOutWithSlippage: "1.970100",
      fee: "0.009999",
      priceImpact: "0.00001839438644256218",
      insufficientLiquidity: false,
    });

    // normal swap, sell quote, disable confidence interval
    expect(() =>
      getSwapOutResult(
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

  it("getSwapInResult", function () {
    const baseMintPublicKey: PublicKey = new Keypair().publicKey;
    const quoteMintPublicKey: PublicKey = new Keypair().publicKey;

    expect(
      getSwapInResult(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,
          mintBaseDecimals: 6,
          mintQuoteDecimals: 6,
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
            minReserveLimitPercentage: 50,
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        "0.324",
        0.5,
        new BigNumber(0.163),
      ),
    ).toEqual({
      amountIn: "2",
      amountOutWithSlippage: "0.322380",
      fee: "0.001994",
      priceImpact: "0.00001840524672233231",
      insufficientLiquidity: false,
    });

    // normal swap, sell base, enable confidence interval
    expect(
      getSwapInResult(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,
          mintBaseDecimals: 9,
          mintQuoteDecimals: 6,
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
            minReserveLimitPercentage: 10,
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
          decimals: 9,
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        "0.324",
        0.5,
        new BigNumber(164),
        new BigNumber(163),
        new BigNumber(165),
      ),
    ).toEqual({
      amountIn: "0.002",
      amountOutWithSlippage: "0.322380",
      fee: "0.001994",
      priceImpact: "0.00001840524672233257",
      insufficientLiquidity: false,
    });

    expect(
      getSwapInResult(
        {
          mintBase: baseMintPublicKey,
          mintQuote: quoteMintPublicKey,
          mintBaseDecimals: 6,
          mintQuoteDecimals: 6,
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
            tradeFeeNumerator: new anchor.BN(10),
            tradeFeeDenominator: new anchor.BN(20010),
            minReserveLimitPercentage: 50,
          } as SwapConfig,
        } as SwapInfo,
        {
          mint: baseMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        {
          mint: quoteMintPublicKey.toBase58(),
          decimals: 6,
        } as TokenConfig,
        "20000",
        0.5,
        new BigNumber(0.163),
      ),
    ).toEqual({
      amountIn: "Infinity",
      amountOutWithSlippage: "19900.000000",
      fee: "10.000000",
      priceImpact: "Infinity",
      insufficientLiquidity: true,
    });
  });

  it("getNormalizedReserves", function () {
    expect(
      getNormalizedReserves(
        new BigNumber(1000),
        new BigNumber(2000),
        new BigNumber(1),
        new BigNumber(2),
        new BigNumber(3),
      ),
    ).toEqual({
      normalizedBaseReserve: new BigNumber(1000),
      normalizedQuoteReserve: new BigNumber(2000),
    });

    expect(
      getNormalizedReserves(
        new BigNumber(1000),
        new BigNumber(5000),
        new BigNumber(20),
        new BigNumber(20),
        new BigNumber(3),
      ),
    ).toEqual({
      normalizedBaseReserve: new BigNumber(2000),
      normalizedQuoteReserve: new BigNumber(2000),
    });
  });
});
