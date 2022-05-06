import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { getClusterApiUrl } from "anchor/anchor_utils";
import { deployConfigV2 } from "constants/deployConfigV2";

export function CustomConnectionProvider({ children }) {
  const clusterApiUrl = getClusterApiUrl(deployConfigV2.network);
  return <ConnectionProvider endpoint={clusterApiUrl}>{children}</ConnectionProvider>;
}
