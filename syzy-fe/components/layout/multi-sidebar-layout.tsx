"use client";

import { Clock, PanelLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileSidebarContent } from "@/components/layout/mobile-sidebar-content";
import { Button } from "@/components/ui/button";
import {
  MultiSidebarProvider,
  MultiSidebarTrigger,
  useMultiSidebar,
} from "@/components/ui/multi-sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { NotifyHeader } from "@/components/shared/notify-header";

const PUMP_FUN_URL = "https://pump.fun/coin/GGmZqC7nTcZH4npvRJz4cxmus4EAGXWdpk4wrc72pump";

function NotifyMessage() {
  return (
    <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-medium text-xs px-4 pt-1">
      <Link
        href={PUMP_FUN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-90 font-semibold"
      >
        Now the Syzy token is LIVE ON pump.fun
      </Link>
    </span>
  );
}

interface MultiSidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  showHeader?: boolean;
  showAppHeader?: boolean;
  title?: string;
}

interface InnerLayoutProps {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  showAppHeader: boolean;
  title: string;
}

function Header({ title, showRightSidebar }: { title: string; showRightSidebar: boolean }) {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <header className="shrink-0 flex items-center justify-between bg-background border-b border-border/50">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 transition-all duration-200",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        <Button variant="ghost" onClick={toggleSidebar} className="p-0 h-8 w-8">
          <PanelLeft className="h-4 w-4" />
        </Button>
        {!isCollapsed && (
          <>
            <div className="mx-2 h-4 w-px bg-foreground/30" />
            <h1 className="font-semibold text-2xl">{title}</h1>
          </>
        )}
      </div>
      <div className="flex items-center px-4 py-3">
        {showRightSidebar && (
          <MultiSidebarTrigger side="right">
            <Clock className="h-4 w-4" />
          </MultiSidebarTrigger>
        )}
      </div>
    </header>
  );
}

function MobileHeader({ title, showRightSidebar }: { title: string; showRightSidebar: boolean }) {
  const { toggleLeftSidebar } = useMultiSidebar();

  return (
    <header className="shrink-0 flex items-center justify-between bg-background border-b border-border/50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleLeftSidebar}>
          <PanelLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>
      {showRightSidebar && (
        <MultiSidebarTrigger side="right">
          <Clock className="h-5 w-5" />
        </MultiSidebarTrigger>
      )}
    </header>
  );
}

function MobileLayout({
  children,
  showRightSidebar,
  showHeader,
  showAppHeader,
  title,
}: InnerLayoutProps) {
  const { leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } =
    useMultiSidebar();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
        <NotifyHeader message={<NotifyMessage />} time={2000} scrollBehavior="hide" />
        {showAppHeader && <AppHeader />}
      {showHeader && <MobileHeader title={title} showRightSidebar={showRightSidebar} />}
      <main className="flex-1 overflow-y-auto overscroll-contain">{children}</main>

      <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
        <SheetContent side="left" className="w-[280px] max-w-[80vw] p-0 border-r-0 overflow-hidden" hideCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <MobileSidebarContent onClose={() => setLeftSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {showRightSidebar && (
        <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
          <SheetContent side="right" className="w-[320px] p-0" hideCloseButton>
            <SheetHeader className="sr-only">
              <SheetTitle>Activity Feed</SheetTitle>
            </SheetHeader>
            <RightSidebar />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function DesktopLayout({
  children,
  showRightSidebar,
  showHeader,
  showAppHeader,
  title,
}: InnerLayoutProps) {
  const { rightSidebarOpen } = useMultiSidebar();

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <NotifyHeader message={<NotifyMessage />} time={2000} scrollBehavior="hide" />
        {showAppHeader && <AppHeader />}
        {showHeader && <Header title={title} showRightSidebar={showRightSidebar} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
      {showRightSidebar && (
        <div
          className={cn(
            "h-screen shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            rightSidebarOpen ? "w-80" : "w-0"
          )}
        >
          <div className="h-full w-80">
            <RightSidebar />
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

function LayoutContent(props: InnerLayoutProps) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLayout {...props} /> : <DesktopLayout {...props} />;
}

export function MultiSidebarLayout({
  children,
  className,
  showRightSidebar = true,
  showHeader = true,
  showAppHeader = true,
  title = "",
}: MultiSidebarLayoutProps) {
  return (
    <MultiSidebarProvider className={className ?? ""}>
      <LayoutContent
        showRightSidebar={showRightSidebar}
        showHeader={showHeader}
        showAppHeader={showAppHeader}
        title={title}
      >
        {children}
      </LayoutContent>
    </MultiSidebarProvider>
  );
}
