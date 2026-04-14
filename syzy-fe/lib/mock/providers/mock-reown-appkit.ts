"use client"

import { useMockWalletStore } from '../stores/mock-chain-store'

// ---------------------------------------------------------------------------
// createAppKit — called once at module scope in providers/solana-provider.tsx
// Returns a dummy object; the real one bootstraps WalletConnect.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAppKit(_config: any) {
  return {}
}

// ---------------------------------------------------------------------------
// useAppKitAccount
// ---------------------------------------------------------------------------

export function useAppKitAccount() {
  const { isConnected, address } = useMockWalletStore()
  return {
    address: isConnected ? address : undefined,
    isConnected,
    status: (isConnected ? 'connected' : 'disconnected') as
      | 'connected'
      | 'connecting'
      | 'disconnected',
    caipAddress: isConnected ? `solana:devnet:${address}` : undefined,
  }
}

// ---------------------------------------------------------------------------
// useAppKitProvider — returns a mock Solana wallet provider
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAppKitProvider(_chain?: string) {
  const walletProvider = {
    signMessage: async (_message: Uint8Array): Promise<Uint8Array> => {
      // Return random bytes as a "signature"
      const sig = new Uint8Array(64)
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(sig)
      }
      return sig
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signTransaction: async (tx: any) => {
      // Return the transaction unchanged (pretend it is signed)
      return tx
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signAndSendTransaction: async (_tx: any) => {
      // Return a fake transaction signature
      return {
        signature:
          'MockTxSig' + Math.random().toString(36).slice(2),
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signAllTransactions: async (txs: any[]) => {
      return txs
    },
  }
  return { walletProvider }
}

// ---------------------------------------------------------------------------
// useAppKit — the { open } function that launches the wallet modal
// ---------------------------------------------------------------------------

export function useAppKit() {
  const { connect, disconnect } = useMockWalletStore()
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    open: (options?: any) => {
      if (options?.view === 'Account') {
        // Opening the account view is the Reown idiom for disconnect
        disconnect()
      } else {
        connect()
      }
    },
  }
}

// ---------------------------------------------------------------------------
// useAppKitTheme
// ---------------------------------------------------------------------------

export function useAppKitTheme() {
  return {
    setThemeMode: (_mode: string) => {
      // no-op in mock mode
    },
    themeMode: 'dark' as const,
  }
}

// ---------------------------------------------------------------------------
// useAppKitNetwork
// ---------------------------------------------------------------------------

export function useAppKitNetwork() {
  return {
    chainId: 'solana:devnet',
    caipNetwork: { id: 'solana:devnet', name: 'Solana Devnet' },
  }
}

// ---------------------------------------------------------------------------
// useDisconnect
// ---------------------------------------------------------------------------

export function useDisconnect() {
  const { disconnect } = useMockWalletStore()
  return { disconnect }
}
