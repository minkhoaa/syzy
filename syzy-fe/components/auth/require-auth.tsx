"use client"

import { useEffect, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useAuthStore } from '@/features/auth/store/use-auth-store'
import { WalletAuthButton } from './wallet-auth-button'
import { Loader2 } from 'lucide-react'

interface RequireAuthProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated } = useAuthStore()
  const { isConnected } = useAppKitAccount()
  const [waitingForAutoLogin, setWaitingForAutoLogin] = useState(false)
  const [prevIsConnected, setPrevIsConnected] = useState(isConnected)
  const [prevIsAuthenticated, setPrevIsAuthenticated] = useState(isAuthenticated)

  // Adjust waiting state during render when auth state changes
  if (prevIsConnected !== isConnected || prevIsAuthenticated !== isAuthenticated) {
    setPrevIsConnected(isConnected)
    setPrevIsAuthenticated(isAuthenticated)
    if (isConnected && !isAuthenticated) {
      setWaitingForAutoLogin(true)
    } else if (isAuthenticated) {
      setWaitingForAutoLogin(false)
    }
  }

  // Give AutoLogin up to 5s to complete, then show fallback
  useEffect(() => {
    if (!waitingForAutoLogin) return
    const timer = setTimeout(() => setWaitingForAutoLogin(false), 5000)
    return () => clearTimeout(timer)
  }, [waitingForAutoLogin])

  if (isAuthenticated) {
    return <>{children}</>
  }

  // Wallet connected, waiting for auto login to complete
  if (waitingForAutoLogin && isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Authenticating...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
      <div className="text-center space-y-4">
        <div className="text-lg font-medium">Authentication Required</div>
        <p className="text-sm text-muted-foreground">
          Please connect your wallet and login to continue
        </p>
        {fallback || <WalletAuthButton />}
      </div>
    </div>
  )
}
