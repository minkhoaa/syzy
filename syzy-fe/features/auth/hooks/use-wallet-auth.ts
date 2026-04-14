"use client"

import { useState } from 'react'
import { useReownWallet } from './use-reown-wallet'
import { toast } from 'sonner'
import bs58 from 'bs58'
import { useAuthStore } from '@/features/auth/store/use-auth-store'
import { apiClient } from '@/lib/kubb'
import { clearEncryptionKey } from '@/features/privacy/utils/zk-storage'
import {
  useAuthControllerGetNonce,
  useAuthControllerVerify,
  useAuthControllerDevLogin
} from '@/lib/api-client/hooks'

// Solana wallet provider interface
interface SolanaWalletProvider {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
  signTransaction: (transaction: unknown) => Promise<unknown>
  sendTransaction: (transaction: unknown, connection: unknown) => Promise<string>
}

export function useWalletAuth() {
  const { address, walletProvider, connected } = useReownWallet()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { setAuthState, logout: storeLogout, accessToken, user } = useAuthStore()

  // Use generated hooks from Kubb with custom apiClient
  const getNonceMutation = useAuthControllerGetNonce({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: { client: apiClient as any }
  })
  
  const verifySignatureMutation = useAuthControllerVerify({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: { client: apiClient as any },
    mutation: {
      onSuccess: (response) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = response as any
        const authData = raw?.data?.access_token ? raw.data
          : raw?.access_token ? raw
          : raw?.data?.data?.access_token ? raw.data.data
          : null
        if (!authData?.access_token) {
          console.error('[WalletAuth] Could not extract tokens from verify response:', raw)
          return
        }
        setAuthState({
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          user: authData.user,
        })
        toast.success('Successfully authenticated!')
      },
    },
  })

  const devLoginMutation = useAuthControllerDevLogin({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: { client: apiClient as any },
    mutation: {
      onSuccess: (response) => {
        console.log('[WalletAuth] Dev login raw response:', JSON.stringify(response))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = response as any
        const authData = raw?.data?.access_token ? raw.data
          : raw?.access_token ? raw
          : raw?.data?.data?.access_token ? raw.data.data
          : null
        if (!authData?.access_token) {
          console.error('[WalletAuth] Could not extract tokens from dev-login response:', raw)
          return
        }
        setAuthState({
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          user: authData.user,
        })
        toast.success('Dev login successful!')
      },
    },
  })

  // Main login function
  const login = async () => {
    if (!address || !walletProvider || !connected) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsAuthenticating(true)

    try {
      // Step 1: Get nonce
      const nonceData = await getNonceMutation.mutateAsync({
        data: { walletAddress: address }
      })

      // Step 2: Sign message with wallet
      const encodedMessage = new TextEncoder().encode(nonceData.message)
      
      const provider = walletProvider as SolanaWalletProvider
      if (!provider.signMessage) {
        throw new Error('Wallet does not support message signing')
      }

      const signature = await provider.signMessage(encodedMessage)
      
      if (!signature) {
        throw new Error('Failed to sign message - no signature returned')
      }

      const signatureBase58 = bs58.encode(signature)

      // Step 3: Verify signature
      const authData = await verifySignatureMutation.mutateAsync({
        data: {
          walletAddress: address,
          signature: signatureBase58,
          message: nonceData.message,
        }
      })

      // ZK encryption key derivation is handled by AutoLogin component
      // which fires when isAuthenticated becomes true

      return authData
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('You rejected the signature request')
        } else if (error.message.includes('not support')) {
          toast.error('Your wallet does not support message signing')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Authentication failed')
      }
      
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Dev login (bypass signature)
  const devLogin = async () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      const data = await devLoginMutation.mutateAsync({
        data: { walletAddress: address }
      })
      return data
    } catch (error) {
      console.error('Dev login error:', error)
      toast.error('Dev login failed')
      throw error
    }
  }

  // Logout
  const logout = () => {
    storeLogout()
    clearEncryptionKey()
    toast.success('Logged out successfully')
  }

  // Get stored token
  const getToken = () => {
    return accessToken
  }

  // Get stored user
  const getUser = () => {
    return user
  }

  return {
    login,
    devLogin,
    logout,
    getToken,
    getUser,
    isAuthenticating,
    isAuthenticated: !!accessToken,
    isLoading: getNonceMutation.isPending || verifySignatureMutation.isPending,
  }
}
