import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  currencyPairToTicker: {},
};

export const fetchTickerThunk = createAsyncThunk("fetchTicker", async (currencyPair: string) => {
  const response = await fetch("/api/spot/tickers/DELFI_USDT");
  const data = await response.json();
  console.info(currencyPair, data);
  const ticker = data && data.length === 1 ? data[0] : null;
  return {
    currencyPair,
    ticker,
  };
});

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
  },
});

export const gateIoReducer = gateIoSlice.reducer;
export const gateIoActions = gateIoSlice.actions;
