"use client";

import { Home, TrendingUp, BarChart3, Settings, ShieldCheck, FileText, Coins, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useIsAdmin } from "@/features/admin/hooks/use-is-admin";
import { useMemo } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

const baseNavigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Markets",
    href: "/markets",
    icon: TrendingUp,
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: BarChart3,
  },
  {
    name: "Agent",
    href: "/agent",
    icon: Bot,
  },
  {
    name: "Staking",
    href: "/staking",
    icon: Coins,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    name: "Waitlist",
    href: "/admin/waitlist",
    icon: ShieldCheck,
    adminOnly: true,
  },
    {
    name: "Content",
    href: "/admin/content",
    icon: FileText,
    adminOnly: true,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin } = useIsAdmin();

  const navigation = useMemo(
    () => baseNavigation.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex flex-1 items-center gap-3 px-4">
          <div className="relative">
            <Image
              src="/logo/syzy.svg"
              alt="Syzy"
              width={80}
              height={80}
              className="h-7 w-auto"
            />
            {/* {isCollapsed && (
              <Badge
                size="sm"
                className="absolute -bottom-[20px] -left-[8px]"
              >
                Devnet
              </Badge>
            )} */}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Badge
                className="text-xs px-1.5 py-0 h-4"
              >
                Devnet
              </Badge>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  size="default"
                  tooltip={item.name}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors mb-2",
                    isCollapsed && "justify-center w-10 h-10 p-0 rounded-lg",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className={cn(
        "border-t border-border/50",
        isCollapsed ? "p-2 items-center" : "p-3"
      )} />
    </Sidebar>
  );
}