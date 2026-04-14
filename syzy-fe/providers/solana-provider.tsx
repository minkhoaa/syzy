"use client"

import React, { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createAppKit, useAppKitTheme } from '@reown/appkit/react'
import { solanaWeb3JsAdapter, projectId, networks, metadata } from '@/lib/reown-config'

// Create the AppKit modal
export const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata,
  features: {
    analytics: true
  },
  themeVariables: {
    '--w3m-accent': '#2dd4bf',
  }
})

interface ReownProviderProps {
  children: React.ReactNode
}

function ThemeSwitcher() {
  const { theme } = useTheme()
  const { setThemeMode } = useAppKitTheme()

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      setThemeMode(theme)
    }
  }, [theme, setThemeMode])

  return null
}

export function ReownProvider({ children }: ReownProviderProps) {
  return (
    <>
      <ThemeSwitcher />
      {children}
    </>
  )
}