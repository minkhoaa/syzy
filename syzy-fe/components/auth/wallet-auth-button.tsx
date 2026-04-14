"use client"

import { useReownWallet } from '@/features/auth/hooks/use-reown-wallet'
import { useWalletAuth } from '@/features/auth/hooks/use-wallet-auth'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function WalletAuthButton() {
  const { address, connected, connect, shortAddress, balance } = useReownWallet()
  const { login, devLogin, logout, getToken, getUser, isAuthenticating } = useWalletAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken())
  const [user, setUser] = useState<any>(() => getUser())

  const handleLogin = async () => {
    if (!connected) {
      connect()
      return
    }

    try {
      await login()
      setIsAuthenticated(true)
      setUser(getUser())
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleDevLogin = async () => {
    if (!connected) {
      connect()
      return
    }

    try {
      await devLogin()
      setIsAuthenticated(true)
      setUser(getUser())
    } catch (error) {
      console.error('Dev login failed:', error)
    }
  }

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  if (!connected) {
    return (
      <Button onClick={connect} size="lg">
        Connect Wallet
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">
          Connected: {shortAddress}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleLogin} 
            disabled={isAuthenticating}
            size="lg"
          >
            {isAuthenticating ? 'Signing...' : 'Sign & Login'}
          </Button>
          <Button 
            onClick={handleDevLogin} 
            variant="outline"
            size="lg"
          >
            Dev Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">
        <div className="font-medium">Authenticated</div>
        <div className="text-muted-foreground">{shortAddress}</div>
        <div className="text-muted-foreground">Balance: {balance.toFixed(4)} SOL</div>
        {user?.username && (
          <div className="text-muted-foreground">Username: {user.username}</div>
        )}
      </div>
      <Button onClick={handleLogout} variant="outline" size="sm">
        Logout
      </Button>
    </div>
  )
}
