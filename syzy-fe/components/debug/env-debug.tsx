"use client"

import { useEffect } from 'react'
import { apiClient } from '@/lib/kubb'

export function EnvDebug() {
  useEffect(() => {
    console.log('=== Environment Debug ===')
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('apiClient.defaults.baseURL:', apiClient.defaults.baseURL)
    console.log('========================')
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono">
      <div className="font-bold mb-2">🔧 Debug Info</div>
      <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</div>
      <div>Base URL: {apiClient.defaults.baseURL}</div>
    </div>
  )
}
