"use client"

import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useMetrics } from '@/features/analytics/hooks/use-metrics'

export function useReownWallet() {
  const { open } = useAppKit()
  const { address, isConnected, status } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('solana')
  const { trackWalletConnect } = useMetrics()
  const wasConnectedRef = useRef(false)

  // Track wallet connect events
  useEffect(() => {
    if (isConnected && address && !wasConnectedRef.current) {
      // Wallet just connected
      trackWalletConnect(address)
    }
    wasConnectedRef.current = isConnected
  }, [isConnected, address, trackWalletConnect])

  // Get wallet balance
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!address || !walletProvider) return 0
      
      try {
        // Use the connection from the provider
        const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.devnet.solana.com")
        const publicKey = new PublicKey(address)
        const balance = await connection.getBalance(publicKey)
        return balance / LAMPORTS_PER_SOL
      } catch (error) {
        console.error('Error fetching balance:', error)
        return 0
      }
    },
    enabled: !!address && isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [address])

  const connect = () => {
    open()
  }

  const disconnect = () => {
    open({ view: 'Account' })
  }

  return {
    address,
    shortAddress,
    connected: isConnected,
    connecting: status === 'connecting',
    chainId,
    balance: balance || 0,
    balanceLoading,
    connect,
    disconnect,
    openModal: open,
    walletProvider
  }
}