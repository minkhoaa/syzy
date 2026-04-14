import { MultiSidebarLayout } from "@/components/layout/multi-sidebar-layout"
import { AgentSessionProvider } from "@/hooks/use-agent-session"
import { WaitlistGate } from "@/features/waitlist/components/waitlist-gate"

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentSessionProvider>
      <MultiSidebarLayout
        showAppHeader={false}
        showHeader={false}
        showRightSidebar={false}
      >
        <WaitlistGate>{children}</WaitlistGate>
      </MultiSidebarLayout>
    </AgentSessionProvider>
  )
}
