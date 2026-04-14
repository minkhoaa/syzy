"use client"

import React from 'react'

// Mock modal — the real one is the return value of createAppKit()
export const modal = {}

/**
 * Drop-in replacement for the real ReownProvider.
 * No wallet SDK is loaded; the mock hooks in mock-reown-appkit.ts
 * supply all the state the app needs.
 */
export function ReownProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
