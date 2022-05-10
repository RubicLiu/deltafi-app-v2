import {
  PublicKey,
  Connection,
  AccountInfo,
  sendAndConfirmTransaction as realSendAndConfirmTransaction,
  Keypair,
  Transaction,
  TransactionSignature,
  Commitment,
} from "@solana/web3.js";

import { chunks } from "./utils";

export const getMultipleAccounts = async (
  connection: Connection,
  keys: PublicKey[],
  commitment: Commitment,
) => {
  const result = await Promise.all(
    chunks(keys, 99).map((chunk) => getMultipleAccountsCore(connection, chunk, commitment)),
  );

  const array = result.map((a) => a.array).flat();
  return { keys, array };
};

const getMultipleAccountsCore = async (
  connection: Connection,
  keys: PublicKey[],
  commitment: Commitment,
) => {
  return {
    keys,
    array: await connection.getMultipleAccountsInfo(keys, commitment),
  };
};
