"use client"

import { useMemo } from 'react'
import { useMockWalletStore } from '../stores/mock-chain-store'

/**
 * Mock replacement for features/auth/hooks/use-reown-wallet.
 * Returns the same shape as the real hook but backed by the mock wallet store.
 */
export function useReownWallet() {
  const { isConnected, address, balance, connect, disconnect } =
    useMockWalletStore()

  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [address])

  return {
    address: isConnected ? address : undefined,
    shortAddress,
    connected: isConnected,
    connecting: false,
    chainId: 'solana:devnet',
    balance,
    balanceLoading: false,
    connect,
    disconnect,
    openModal: connect, // Just connect when modal would open
    walletProvider: {
      signMessage: async (_msg: Uint8Array) => new Uint8Array(64),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signTransaction: async (tx: any) => tx,
    },
  }
}
