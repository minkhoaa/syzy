import { MultiSidebarLayout } from "@/components/layout/multi-sidebar-layout"
import { WaitlistGate } from "@/features/waitlist/components/waitlist-gate"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MultiSidebarLayout
      showAppHeader={true}
      showHeader={false}
      showRightSidebar={false}
    >
      <WaitlistGate>{children}</WaitlistGate>
    </MultiSidebarLayout>
  )
}
