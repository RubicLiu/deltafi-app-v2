import { Keypair } from '@solana/web3.js'

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function reportError(err: unknown, context: string) {
  if (err instanceof Error) {
    console.error(context, err)
  }
}

export function isLocalHost() {
  return window.location.hostname === 'localhost'
}

export const getLocalStorageKeypair = (key: string): Keypair => {
  const base64Keypair = window.localStorage.getItem(key)
  if (base64Keypair) {
    return Keypair.fromSecretKey(Uint8Array.from(atob(base64Keypair), (c) => c.charCodeAt(0)))
  } else {
    const account = Keypair.generate()
    window.localStorage.setItem(key, Buffer.from(account.secretKey).toString('base64'))
    return account
  }
}

const SPLIT = ((): number => {
  const split = parseInt(new URLSearchParams(window.location.search).get('split') || '')
  if (!isNaN(split)) {
    return Math.min(split, 12)
  }
  return 4
})()

export const FEE_PAYERS = (() => {
  const accounts = []
  for (let i = 0; i < SPLIT; i++) {
    accounts.push(getLocalStorageKeypair(`feePayerKey${i + 1}`))
  }
  return accounts
})()
