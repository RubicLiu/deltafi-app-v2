import React, { createContext, useState, useMemo, useContext, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";

import { ConfigContextValues, MarketConfig } from "./types";
import { useAccountInfo } from "./connection";
import { parserConfigInfo } from "lib/state";
import { SWAP_PROGRAM_ID } from "constants/index";

const ConfigContext: React.Context<null | ConfigContextValues> =
  createContext<null | ConfigContextValues>(null);

export function ConfigProvider({ children }) {
  const [configAddress, setConfigAddress] = useState<null | PublicKey>(null);
  const [configInfo] = useAccountInfo(configAddress);

  const config = useMemo(() => {
    if (configInfo) {
      const { data } = parserConfigInfo(configInfo);
      const ret: MarketConfig = {
        verion: data.version,
        publicKey: configAddress,
        bumpSeed: data.bumpSeed,
        deltafiMint: data.deltafiMint,
        oracleProgramId: data.oracleProgramId,
        deltafiToken: data.deltafiToken,
      };
      return ret;
    }
  }, [configAddress, configInfo]);

  return (
    <ConfigContext.Provider value={{ config, setConfigAddress }}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("Missing market config context");
  }
  return context;
}

export function useMarketAuthorityKey() {
  const { config } = useConfig();
  const { publicKey, bumpSeed } = config;
  const [marketAuthorityKey, setMarketAuthorityKey] = useState<null | PublicKey>(null);

  useEffect(() => {
    const fn = async () => {
      const seedBuffer = new ArrayBuffer(1);
      try {
        const authorityKey = await PublicKey.createProgramAddress(
          [publicKey.toBuffer(), new Uint8Array(seedBuffer, bumpSeed)],
          SWAP_PROGRAM_ID,
        );
        setMarketAuthorityKey(authorityKey);
      } catch (err) {
        console.error(err);
      }
    };
    fn();
  }, [publicKey, bumpSeed]);

  return { marketAuthorityKey };
}
