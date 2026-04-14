"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/features/auth/store/use-auth-store"

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"

export interface Conversation {
  id: string
  title: string | null
  mode: string
  createdAt: string
  messageCount: number
  isPinned: boolean
  shareToken?: string
}

export function useChatHistory() {
  const { user } = useAuthStore()
  const walletAddress = user?.walletAddress

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["chat-conversations", walletAddress],
    queryFn: async () => {
      const res = await fetch(
        `${baseUrl}/api/chat/conversations?wallet=${walletAddress}&limit=20`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return json.data as Conversation[]
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  })

  return { conversations: data ?? [], isLoading, refetch }
}

export async function pinConversation(
  id: string,
  walletAddress: string,
  isPinned: boolean
) {
  const res = await fetch(`${baseUrl}/api/chat/${id}/pin`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress, is_pinned: isPinned }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function renameConversation(
  id: string,
  walletAddress: string,
  title: string
) {
  const res = await fetch(`${baseUrl}/api/chat/${id}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress, title }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteConversation(
  id: string,
  walletAddress: string
) {
  const res = await fetch(`${baseUrl}/api/chat/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function shareConversation(
  id: string,
  walletAddress: string
): Promise<string> {
  const res = await fetch(
    `${baseUrl}/api/chat/${id}/share?wallet=${walletAddress}`,
    { method: "POST" }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const data = json.data ?? json
  return data.share_url ?? data.shareUrl ?? data.url ?? ""
}
