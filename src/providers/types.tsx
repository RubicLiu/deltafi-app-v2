import { PublicKey } from "@solana/web3.js";

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