"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistMemberAuthStore } from "@/features/waitlist/store/use-waitlist-member-auth-store";
import { useWaitlistMemberSession } from "@/features/waitlist/hooks/use-waitlist-member-session";

interface WaitlistGateProps {
  children: React.ReactNode;
}

const PUBLIC_PREFIXES = ["/", "/waitlist", "/staking", "/blog", "/x402", "/faucet"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function WaitlistGate({ children }: WaitlistGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { connected } = useReownWallet();
  const { isAuthenticated, restore } = useWaitlistMemberSession();
  const store = useWaitlistMemberAuthStore();
  const [mounted, setMounted] = useState(false);

  // Always call hooks at top level — never conditionally
  useEffect(() => {
    setMounted(true);
    void restore();
  }, [restore]);

  // Always call redirect effect — redirect logic is inside
  useEffect(() => {
    if (!mounted) return;

    const hasEmail = !!store.member?.email;
    const passed = connected && isAuthenticated && hasEmail;

    if (!passed) {
      // Save intended destination then redirect
      if (pathname) {
        sessionStorage.setItem("waitlist_redirect", pathname);
      }
      router.replace("/waitlist");
    }
  }, [mounted, connected, isAuthenticated, store.member?.email, router, pathname]);

  // Always call redirecting state — value is conditional
  const hasEmail = !!store.member?.email;
  const passed = connected && isAuthenticated && hasEmail;

  // Skip gate for public routes (after mounted to avoid hydration issues)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (!passed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-neutral-400 text-sm">Redirecting to waitlist...</p>
      </div>
    );
  }

  return <>{children}</>;
}
