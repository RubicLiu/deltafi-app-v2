import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const DELFI_USDT = "DELFI_USDT";

export type GateIoTicker = {
  baseVolume: string;
  changePercentage: string;
  currencyPair: string;
  high24h: string;
  highestBid: string;
  last: string;
  low24h: string;
  lowestAsk: string;
  quoteVolume: string;
};

const initialState = {
  currencyPairToTicker: {},
  currencyPairToCandleSticks: {},
};

export const fetchTickerThunk = createAsyncThunk("fetchTicker", async (currencyPair: string) => {
  const response = await fetch("/api/spot/tickers/" + currencyPair);
  const data = await response.json();
  const ticker: GateIoTicker | null = data && data.length === 1 ? data[0] : null;
  return {
    currencyPair,
    ticker,
  };
});

export const fetchCandleSticksThunk = createAsyncThunk(
  "fetchCandleSticks",
  async (currencyPair: string) => {
    const response = await fetch("/api/spot/candlesticks/" + currencyPair);
    const data = await response.json();
    return {
      currencyPair,
      candleSticks: data,
    };
  },
);

const gateIoSlice = createSlice({
  name: "gateIo",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTickerThunk.fulfilled, (state, action) => {
      if (action.payload.ticker) {
        state.currencyPairToTicker[action.payload.currencyPair] = action.payload.ticker;
      }
    });

    builder.addCase(fetchCandleSticksThunk.fulfilled, (state, action) => {
      if (action.payload.candleSticks) {
        state.currencyPairToCandleSticks[action.payload.currencyPair] = action.payload.candleSticks;
      }
    });
  },
});

export const gateIoReducer = gateIoSlice.reducer;
export const gateIoActions = gateIoSlice.actions;
