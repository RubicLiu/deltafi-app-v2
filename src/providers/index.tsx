import { HelmetProvider } from "react-helmet-async";

import { CustomWalletProvider as WalletProvider } from "./wallet";
import { ThemeContextProvider } from "./theme";
import { ModalProvider } from "./modal";
import { getClusterApiUrl } from "anchor/anchor_utils";
import { deployConfigV2 } from "constants/deployConfigV2";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

export function Providers({ children }) {
  const clusterApiUrl = getClusterApiUrl(deployConfigV2.network);
  return (
    <ConnectionProvider endpoint={clusterApiUrl}>
      <WalletProvider>
        <HelmetProvider>
          <ThemeContextProvider>
            <ModalProvider>{children}</ModalProvider>
          </ThemeContextProvider>
        </HelmetProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default Providers;
