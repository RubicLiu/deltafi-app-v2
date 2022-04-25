import { DeltafiDexV2 } from "./types/deltafi_dex_v2";
import { PublicKey } from "@solana/web3.js";
import { Program, web3 } from "@project-serum/anchor";
import fullDeployConfigV2 from "./fullDeployConfigV2.json";
import deltafiDexV2Idl from "./idl/deltafi_dex_v2.json";
import * as anchor from "@project-serum/anchor";

// TODO(ypeng): Read deploy mode from environment variable.
export const deployConfigV2 = fullDeployConfigV2.testnet;

export function getClusterApiUrl(network: string) {
  if (network === "localhost") {
    return "http://localhost:8899";
  }
  return web3.clusterApiUrl(network as web3.Cluster);
}

export function getDeltafiDexV2(connection, wallet, programId: PublicKey): Program<DeltafiDexV2> {
  const provider = new anchor.Provider(connection, wallet, anchor.Provider.defaultOptions());
  const idl = JSON.parse(JSON.stringify(deltafiDexV2Idl));
  return new Program(idl, programId, provider);
}
