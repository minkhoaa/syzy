"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Bell, Search, TrendingUp, Wallet, ChevronsLeft, Menu } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { useNotificationControllerGetUnreadCount } from "@/lib/api-client/hooks/use-notification-controller-get-unread-count";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/ui/marquee";
import { WalletButton } from "@/components/shared/wallet/wallet-button";
import { SearchModal } from "@/components/shared/search-modal";
import { NotificationModal } from "@/components/shared/notification-modal";
import { SolIcon } from "@/components/ui/sol-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { useCoinGeckoPrice } from "@/features/analytics/hooks/use-coingecko";
import { useMultiSidebar } from "@/components/ui/multi-sidebar";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useMarketList } from "@/features/markets/hooks/use-market-list";
import { marketItemsToEvents } from "@/app/(dashboard)/markets/_utils/market-list-adapter";
import { HelpButton } from "@/features/onboarding/components/help-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const FALLBACK_SOL_DATA = {
  current_price: 205.42,
  price_change_24h: -2.34,
  price_change_percentage_24h: -1.13,
  total_volume: 2.8e9,
} as const;

function MobileRotatingDisplay() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: solPrice, isLoading } = useCoinGeckoPrice("solana");
  const priceData = solPrice ?? FALLBACK_SOL_DATA;
  const isPositive = priceData.price_change_24h >= 0;

  const displays = [
    {
      id: 'logo',
      content: (
        <Link href="/" className="flex items-center">
          <Image
            src="/logo/syzy.svg"
            alt="Syzy"
            width={80}
            height={80}
            className="h-7 w-auto object-contain"
          />
        </Link>
      )
    },
    {
      id: 'devnet',
      content: (
        <Badge className="text-xs">Devnet</Badge>
      )
    },
    {
      id: 'price',
      content: isLoading ? (
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full bg-muted/60" />
          <Skeleton className="w-16 h-5 bg-muted/60" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <SolIcon size={18} className="text-purple-500" />
          <span className="font-bold text-sm">${priceData.current_price.toFixed(2)}</span>
        </div>
      )
    },
    {
      id: 'volume',
      content: isLoading ? (
        <Skeleton className="w-24 h-5 bg-muted/60" />
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Vol:</span>
          <span className="text-xs font-semibold">${(priceData.total_volume / 1e9).toFixed(1)}B</span>
          <span
            className={cn(
              "text-xs font-medium ml-0.5",
              isPositive ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"
            )}
          >
            {isPositive ? "+" : ""}{priceData.price_change_percentage_24h.toFixed(1)}%
          </span>
        </div>
      )
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displays.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [displays.length]);

  return (
    <div className="relative h-7 w-24 shrink-0">
      {displays.map((display, idx) => (
        <div
          key={display.id}
          className={cn(
            "absolute inset-0 flex items-center transition-opacity duration-500",
            idx === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {display.content}
        </div>
      ))}
    </div>
  );
}
function useHotPredictions() {
  const { markets } = useMarketList();
  const events = marketItemsToEvents(markets);
  return events
    .filter((event) => event.is_trending && (event.markets?.length ?? 0) > 0)
    .slice(0, 8)
    .map((event) => {
      const primaryMarket = event.markets[0];
      const volume = event.volume;
      const probability = primaryMarket.probability;
      const formatVolume = (vol: number) => {
        if (vol >= 1) return `${vol.toFixed(1)}`;
        if (vol >= 0.001) return `${(vol * 1000).toFixed(0)}m`;
        return vol.toFixed(4);
      };
      return {
        id: event.id,
        slug: event.slug,
        iconUrl: event.icon_url,
        badge: event.main_tag || "Crypto",
        question: event.title,
        probability: Math.round(probability),
        volume: formatVolume(volume),
        trend: (probability > 50 ? "up" : "down") as "up" | "down",
      };
    });
}

const PredictionCard = ({
  slug,
  iconUrl,
  badge,
  question,
  probability,
  volume,
  trend,
}: {
  id: string;
  slug: string;
  iconUrl: string;
  badge: string;
  question: string;
  probability: number;
  volume: string;
  trend: "up" | "down";
}) => {
  const isUp = trend === "up";
  return (
    <Link href={`/markets/${slug}`}>
      <div className="bg-card border border-border/40 h-12 w-60 cursor-pointer overflow-hidden rounded-full px-4 transition-all hover:border-primary/40 hover:bg-accent/30 flex items-center gap-2.5 shrink-0">
        {/* Icon */}
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-border/50">
          <img src={iconUrl} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground leading-tight truncate">
              {question}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="secondary" className="text-[8px] font-bold px-1 py-0 h-3.5">
              {badge}
            </Badge>
            <span className="text-[9px] text-muted-foreground">{volume} XLM</span>
          </div>
        </div>

        {/* Probability */}
        <div className="flex items-center gap-1 shrink-0">
          <TrendingUp
            className={cn(
              "h-3 w-3",
              isUp ? "text-emerald-500" : "text-red-500 rotate-180"
            )}
          />
          <span className={cn(
            "text-sm font-bold tabular-nums",
            isUp ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
          )}>
            {probability}%
          </span>
        </div>
      </div>
    </Link>
  );
};

function SolPriceDisplay() {
  const { data: solPrice, isLoading, error } = useCoinGeckoPrice("solana");
  const priceData = solPrice ?? FALLBACK_SOL_DATA;
  const isPositive = priceData.price_change_24h >= 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full bg-muted/60" />
          <div className="flex items-center gap-1">
            <Skeleton className="w-20 h-6 bg-muted/60" /> {/* Match text-base height */}
            <Skeleton className="w-16 h-5 bg-muted/60" /> {/* Match text-sm height */}
          </div>
        </div>
        <Skeleton className="w-24 h-5 bg-muted/60" /> {/* Match text-sm height */}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <SolIcon size={20} className="text-purple-500" />
        <div className="flex items-center gap-1">
          <span className="font-bold text-base">${priceData.current_price.toFixed(2)}</span>
          <span
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
            )}
          >
            ({isPositive ? "+" : ""}{priceData.price_change_percentage_24h.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Vol 24h: ${(priceData.total_volume / 1e9).toFixed(1)}B
      </div>

      {error && (
        <span title="Using cached data" className="inline-flex">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </span>
      )}
    </div>
  );
}

function SearchBar({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <div className="relative w-full min-w-0">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 pointer-events-none z-10" />
      <Input
        placeholder="Search markets..."
        className="pl-10 h-9 bg-card/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card/50 text-sm w-full cursor-pointer rounded-full"
        onClick={onSearchClick}
        readOnly
      />
    </div>
  );
}

function MobileWalletButton() {
  const { connected, openModal } = useReownWallet();

  if (connected) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => openModal({ view: 'Account' })}
        className="h-8 w-8 rounded-full border"
      >
        <SolIcon size={14} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => openModal()}
      className="h-8 w-8 rounded-full"
    >
      <Wallet className="h-4 w-4" />
    </Button>
  );
}

function MobileHeaderActions({
  onNotificationClick,
  onSearchClick,
  onSidebarToggle,
  unreadCount,
}: {
  onNotificationClick: () => void;
  onSearchClick: () => void;
  onSidebarToggle: () => void;
  unreadCount: number;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0 pr-10">
      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 rounded-full"
        onClick={onSearchClick}
      >
        <Search className="h-4 w-4" />
      </Button>

      <HelpButton />
      <ThemeToggle />

      <Button
        variant="outline"
        size="icon-sm"
        className="relative h-8 w-8 rounded-full"
        onClick={onNotificationClick}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-3 w-3 p-0 text-[10px] flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <MobileWalletButton />

      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 rounded-full"
        onClick={onSidebarToggle}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </div>
  );
}

function HeaderActions({
  onNotificationClick,
  unreadCount,
}: {
  onNotificationClick: () => void;
  unreadCount: number;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0 pr-8">
      <HelpButton />
      <ThemeToggle />

      <Button
        variant="outline"
        size="icon-sm"
        className="relative h-8 w-8 rounded-full"
        onClick={onNotificationClick}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-3 w-3 p-0 text-[12px] flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <div data-tour="wallet-button">
        <WalletButton />
      </div>
    </div>
  );
}

function RightSidebarToggle() {
  const { toggleRightSidebar } = useMultiSidebar();

  return (
    <Button
      variant="outline"
      onClick={toggleRightSidebar}
      className="absolute right-0 top-0 h-full w-6 rounded-none border-0 border-l hover:border-l-primary/50 hover:bg-primary/5 transition-colors"
    >
      <ChevronsLeft className="h-4 w-4" />
    </Button>
  );
}

function HotPredictionsMarquee() {
  const hotPredictions = useHotPredictions();

  if (hotPredictions.length === 0) return null;

  return (
    <div className="relative">
      <Marquee pauseOnHover className="[--duration:45s] [--gap:0.75rem] py-0">
        {hotPredictions.map((prediction) => (
          <PredictionCard key={prediction.id} {...prediction} />
        ))}
      </Marquee>

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent z-10" />
    </div>
  );
}

export function AppHeader() {
  const isMobile = useIsMobile();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const { toggleLeftSidebar } = useMultiSidebar();
  const { accessToken } = useAuthStore();
  const pathname = usePathname();
  const isAuthenticated = !!accessToken;

  const { data: unreadData } = useNotificationControllerGetUnreadCount({
    query: {
      enabled: isAuthenticated,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const unreadCount: number = isAuthenticated ? (unreadData?.count ?? 0) : 0;

  const handleSearchClick = () => {
    setSearchModalOpen(true);
  };

  const handleNotificationClick = () => {
    setNotificationModalOpen(true);
  };

  const handleSidebarToggle = () => {
    toggleLeftSidebar();
  };

  if (isMobile) {
    return (
      <>
        <div className="w-full max-w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
          {/* Mobile header */}
          <div className="relative flex items-center justify-between p-3 gap-3 min-w-0">
            <MobileRotatingDisplay />
            <MobileHeaderActions
              onNotificationClick={handleNotificationClick}
              onSearchClick={handleSearchClick}
              onSidebarToggle={handleSidebarToggle}
              unreadCount={unreadCount}
            />
            <RightSidebarToggle />
          </div>

          {/* Hot predictions marquee */}
          <div className="pb-2 overflow-hidden">
            <HotPredictionsMarquee />
          </div>
        </div>

        {/* Modals */}
        <SearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
        />
        <NotificationModal
          open={notificationModalOpen}
          onOpenChange={setNotificationModalOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
        {/* Desktop top bar */}
        <div className="relative flex items-center border-b justify-between p-3 gap-8 min-w-0">
          <div className="flex items-center gap-8 shrink-0">
            <SolPriceDisplay />

            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/markets"
                className={cn(
                  "text-sm font-bold transition-colors hover:text-primary",
                  pathname.startsWith("/markets") ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}
              >
                Markets
              </Link>
              <Link
                href="/staking"
                className={cn(
                  "text-sm font-bold transition-colors hover:text-primary",
                  pathname.startsWith("/staking") ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}
              >
                Staking
              </Link>
              <Link
                href="/portfolio"
                className={cn(
                  "text-sm font-bold transition-colors hover:text-primary",
                  pathname.startsWith("/portfolio") ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}
              >
                Portfolio
              </Link>
            </nav>
          </div>

          <div className="flex-1 min-w-0 max-w-sm">
            <SearchBar onSearchClick={handleSearchClick} />
          </div>

          <div className="shrink-0">
            <HeaderActions
              onNotificationClick={handleNotificationClick}
              unreadCount={unreadCount}
            />
          </div>
          <RightSidebarToggle />
        </div>

        {/* Hot predictions marquee */}
        <div className="py-2 overflow-hidden">
          <HotPredictionsMarquee />
        </div>
      </div>

      {/* Modals */}
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
      />
      <NotificationModal
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
      />
    </>
  );
}