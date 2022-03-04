import { createAction } from "@reduxjs/toolkit";

// ! the generis of createAction is the type of payload

export const SET_REFERRER = "APP.SET_REFERRER";
export const setReferrer = createAction<{ referrer: string }>(SET_REFERRER);
