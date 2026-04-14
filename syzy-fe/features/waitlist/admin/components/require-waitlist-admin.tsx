"use client";

import { ReactNode } from "react";
import { Loader2, ShieldAlert, Wallet } from "lucide-react";
import { useReownWallet } from "@/features/auth/hooks/use-reown-wallet";
import { useWaitlistAdminSession } from "@/features/waitlist/hooks/use-waitlist-admin-session";
import { Button } from "@/components/ui/button";

interface RequireWaitlistAdminProps {
  children: ReactNode;
}

export function RequireWaitlistAdmin({ children }: RequireWaitlistAdminProps) {
  const { connected, connect } = useReownWallet();
  const { isAuthenticated, login, logout } = useWaitlistAdminSession();

  if (!connected) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center space-y-4">
        <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-lg font-medium">Connect admin wallet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Waitlist admin access requires a verified wallet.
          </p>
        </div>
        <Button onClick={connect} variant="default">
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <div>
          <p className="text-lg font-medium text-destructive">
            Waitlist admin access required
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your wallet is not on the waitlist admin allowlist.
          </p>
        </div>
        <Button onClick={() => void login("", "")} variant="destructive">
          Verify Wallet
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
