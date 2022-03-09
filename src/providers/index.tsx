import { HelmetProvider } from "react-helmet-async";

import { CustomConnectionProvider as ConnectionProvider } from "./connection";
import { CustomWalletProvider as WalletProvider } from "./wallet";
import { ThemeContextProvider } from "./theme";
import { ModalProvider } from "./modal";
import { ConfigProvider } from "./config";

export function Providers({ children }) {
  return (
    <ConnectionProvider>
      <WalletProvider>
        <ConfigProvider>
          <HelmetProvider>
            <ThemeContextProvider>
              <ModalProvider>{children}</ModalProvider>
            </ThemeContextProvider>
          </HelmetProvider>
        </ConfigProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default Providers;
