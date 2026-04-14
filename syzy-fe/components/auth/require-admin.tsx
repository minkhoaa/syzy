"use client"

import { useEffect, useState } from 'react'
import { ShieldAlert, Wallet, Loader2 } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { apiClient } from '@/lib/kubb'
import { WalletAuthButton } from './wallet-auth-button'

interface RequireAdminProps {
  children: React.ReactNode
}

interface AdminCheckResponse {
  success: boolean
  data: {
    isAdmin: boolean
  }
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { address, isConnected } = useAppKitAccount()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      if (!address) {
        setIsAdmin(null)
        return
      }

      setIsLoading(true)
      try {
        const response = await apiClient.get<AdminCheckResponse>(
          `/api/admin/check/${address}`
        )
        setIsAdmin(response.data.data.isAdmin)
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [address])

  // Not connected - show connect wallet prompt
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Wallet className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-lg font-medium">Connect Admin Wallet</div>
          <p className="text-sm text-muted-foreground max-w-md">
            Please connect an admin wallet to access this page.
          </p>
          <WalletAuthButton />
        </div>
      </div>
    )
  }

  // Loading - show spinner
  if (isLoading || isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Checking admin access...</p>
      </div>
    )
  }

  // Connected but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <div className="text-lg font-medium">Admin Access Required</div>
          <p className="text-sm text-muted-foreground max-w-md">
            This page is restricted to contract administrators only.
            Your wallet address does not have admin privileges.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Connected: {address.slice(0, 8)}...{address.slice(-8)}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
