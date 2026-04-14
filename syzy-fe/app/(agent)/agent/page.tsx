import { RequireAuth } from "@/components/auth/require-auth"
import { AgentChat } from "@/components/x402/agent-chat"

export const metadata = {
  title: "AI Agent | Syzy",
}

export default function AgentPage() {
  return (
    <RequireAuth>
      <AgentChat />
    </RequireAuth>
  )
}
