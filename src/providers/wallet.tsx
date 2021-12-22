import { useMemo } from 'react'
import {
  getCoin98Wallet,
  getLedgerWallet,
  getPhantomWallet,
  // getSafePalWallet,
  getSolflareWallet,
  getSolflareWebWallet,
  getSolletExtensionWallet,
  getSolletWallet,
} from '@solana/wallet-adapter-wallets'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

export function CustomWalletProvider({ children }) {
  const network = process.env.REACT_APP_NETWORK as WalletAdapterNetwork
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolflareWebWallet(),
      getLedgerWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
      getCoin98Wallet(),
      // getSafePalWallet(),
    ],
    [network],
  )
  const onErrorWallet = (error: WalletError) => {
    console.error(error)
  }

  return (
    <WalletProvider wallets={wallets} onError={onErrorWallet} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  )
}
