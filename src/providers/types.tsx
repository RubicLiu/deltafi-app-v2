import { PublicKey } from "@solana/web3.js";

export interface ConnectionContextValues {
  endpoint: string;
  network: string;
  setNetwork: (network: string) => void;
}

export interface EndpointInfo {
  name: string;
  endpoint: string;
  custom: boolean;
}

export interface ModalInfo {
  menuOpen: boolean;
  menu: string;
  address: PublicKey | null;
  data: any;
}

export interface ModalContextInfo {
  modalInfo: ModalInfo;
  setMenu: (open: boolean, menu?: string, address?: PublicKey, data?: any) => void;
}

export interface MarketConfig {
  publicKey: PublicKey;
  bumpSeed: number;
  deltafiMint: PublicKey;
  deltafiToken: PublicKey;
}
