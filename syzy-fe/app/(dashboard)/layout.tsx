import { MultiSidebarLayout } from "@/components/layout/multi-sidebar-layout"
import { TradeFeedTicker } from "@/components/layout/trade-feed-ticker"
import { WaitlistGate } from "@/features/waitlist/components/waitlist-gate"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MultiSidebarLayout
      showAppHeader={true}
      showHeader={false}
      showRightSidebar={true}
    >
      <TradeFeedTicker />
      <WaitlistGate>{children}</WaitlistGate>
    </MultiSidebarLayout>
  )
}
