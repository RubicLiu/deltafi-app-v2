import { createReducer, createAsyncThunk } from "@reduxjs/toolkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { deployConfigV2 } from "constants/deployConfigV2";
import { getDeltafiDexV2, makeProvider } from "anchor/anchor_utils";
import { DeltafiUser } from "anchor/type_definitions";

const initialState: {
  user: DeltafiUser;
  publicKey: PublicKey;
  fetched: boolean;
} = {
  user: null,
  publicKey: null,
  fetched: false,
};

type FetchDeltafiUserThunkArg = {
  connection: Connection;
  walletAddress: PublicKey;
};

export const fetchDeltafiUserThunk = createAsyncThunk(
  "v2/fetchUser",
  async (arg: FetchDeltafiUserThunkArg) => {
    const program = getDeltafiDexV2(
      new PublicKey(deployConfigV2.programId),
      makeProvider(arg.connection, arg.walletAddress),
    );

    const [deltafiUserPubkey] = await PublicKey.findProgramAddress(
      [
        Buffer.from("User"),
        new PublicKey(deployConfigV2.marketConfig).toBuffer(),
        arg.walletAddress.toBuffer(),
      ],
      program.programId,
    );

    const deltafiUser: DeltafiUser = await program.account.deltafiUser.fetchNullable(
      deltafiUserPubkey,
    );
    return {
      user: deltafiUser,
      publicKey: deltafiUserPubkey,
    };
  },
);

export const deltafiUserAccountReducer = createReducer(initialState, (builder) => {
  builder.addCase(fetchDeltafiUserThunk.fulfilled, (state, action) => {
    state.user = action.payload.user;
    state.publicKey = action.payload.publicKey;
    state.fetched = true;
  });
});
