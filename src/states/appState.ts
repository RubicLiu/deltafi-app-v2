import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  referrer: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReferrer(state, action: PayloadAction<string>) {
      state.referrer = action.payload;
    },
  },
});

export const appReducer = appSlice.reducer;
export const appActions = appSlice.actions;
