import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { toBufferLE } from "bigint-buffer";

export enum SWAP_DIRECTION {
  SellBase = 0,
  SellQuote,
}

export const createApproveInstruction = (
  account: PublicKey,
  delegate: PublicKey,
  owner: PublicKey,
  amount: bigint,
) => {
  return Token.createApproveInstruction(
    TOKEN_PROGRAM_ID,
    account,
    delegate,
    owner,
    [],
    u64.fromBuffer(toBufferLE(amount, 8)),
  );
};
