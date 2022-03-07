import { HelmetProvider } from "react-helmet-async";

import { CustomConnectionProvider as ConnectionProvider } from "./connection";
import { CustomWalletProvider as WalletProvider } from "./wallet";
import { ThemeContextProvider } from "./theme";
import { RefreshContextProvider } from "./refresh";
import { ModalProvider } from "./modal";
import { ConfigProvider } from "./config";
import { EntirePoolsProvider } from "./pool";
import { PythProvider } from "./pyth";

export function Providers({ children }) {
  return (
    <ConnectionProvider>
      <WalletProvider>
        <ConfigProvider>
          <HelmetProvider>
            <ThemeContextProvider>
              <RefreshContextProvider>
                <ModalProvider>
                  <EntirePoolsProvider>
                    <PythProvider>{children}</PythProvider>
                  </EntirePoolsProvider>
                </ModalProvider>
              </RefreshContextProvider>
            </ThemeContextProvider>
          </HelmetProvider>
        </ConfigProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default Providers;
