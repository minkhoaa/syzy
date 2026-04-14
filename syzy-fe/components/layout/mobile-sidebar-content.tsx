"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  HelpCircle,
  BarChart3,
  Target,
  ChevronRight,
  X,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { TEAM_WALLET } from "@/lib/constants/programs";

interface MobileSidebarContentProps {
  onClose?: () => void;
}

const baseNavigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    badge: null,
  },
  {
    title: "Markets",
    href: "/markets",
    icon: TrendingUp,
    badge: "Hot",
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Agent",
    href: "/agent",
    icon: Bot,
    badge: null,
  },
  {
    title: "Predictions",
    href: "/predictions",
    icon: Target,
    badge: null,
  },
];

const bottomItems = [
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
  },
];

function NavigationItem({
  item,
  isActive,
  onClick
}: {
  item: typeof baseNavigationItems[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors",
        isActive 
          ? "bg-primary/10 text-primary border border-primary/20" 
          : "hover:bg-muted/50 text-foreground"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{item.title}</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        {item.badge && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
            {item.badge}
          </Badge>
        )}
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
      </div>
    </button>
  );
}

export function MobileSidebarContent({ onClose }: MobileSidebarContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isAdmin = user?.walletAddress === TEAM_WALLET.toString();

  const navigationItems = [
    ...baseNavigationItems,
    ...(isAdmin
      ? [
          {
            title: "Admin",
            href: "/admin",
            icon: ShieldCheck,
            badge: null,
          },
          {
            title: "Waitlist",
            href: "/admin/waitlist",
            icon: ShieldCheck,
            badge: null,
          },
        ]
      : []),
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose?.();
  };

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <Link 
        href="/"
          className="flex items-center gap-2 min-w-0 hover:bg-accent/50 transition-colors rounded-lg p-1 -m-1"
        >
          <Image
            src="/logo/syzy.svg"
            alt="Syzy"
            width={80}
            height={80}
            className="h-7 w-auto shrink-0"
          />
          <div className="min-w-0 flex items-center gap-1.5">
            <Badge>Devnet</Badge>
          </div>
        </Link>
        
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1">
        <div className="p-3 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </div>
          
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onClick={() => handleNavigation(item.href)}
            />
          ))}
        </div>

        <Separator className="mx-3" />

        <div className="p-3 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account
          </div>
          
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{item.title}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer with theme toggle */}
      <div className="shrink-0 border-t border-border p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Theme</span>
        <ThemeToggle />
      </div>
    </div>
  );
}
