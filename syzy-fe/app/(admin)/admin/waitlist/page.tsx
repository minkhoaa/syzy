'use client';

import { RequireWaitlistAdmin } from "@/features/waitlist/admin/components/require-waitlist-admin";
import { useWaitlistAdminSummary } from "@/features/waitlist/admin/hooks/use-waitlist-admin-summary";
import { Users, Mail, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WaitlistAdminPage() {
  return (
    <RequireWaitlistAdmin>
      <WaitlistAdminContent />
    </RequireWaitlistAdmin>
  );
}

function WaitlistAdminContent() {
  const { data, isLoading, isError } = useWaitlistAdminSummary();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Waitlist Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Wallet signups, contactable members, and referral leaders.
        </p>
      </div>

      {isLoading && (
        <div className="text-muted-foreground">Loading...</div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          Failed to load waitlist summary. Is the waitlist backend running?
        </div>
      )}

      {data && (
        <>
          {/* Stats row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  All members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{data.allTime.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contactable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{data.contactable.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top referrer score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {data.topReferrers[0]?.validReferralCount ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick links */}
          <div className="flex gap-4">
            <a
              href="/admin/waitlist/entries"
              className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              View all entries
            </a>
            <a
              href="/admin/waitlist/exports"
              className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
            >
              Export data
            </a>
          </div>

          {/* Top referrers */}
          {data.topReferrers.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold">Top referrers</h2>
              </div>
              <div className="divide-y">
                {data.topReferrers.map((referrer, i) => (
                  <div key={referrer.walletAddress} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-6">#{i + 1}</span>
                      <code className="text-sm font-mono text-foreground">
                        {referrer.walletAddress.slice(0, 8)}...{referrer.walletAddress.slice(-6)}
                      </code>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {referrer.validReferralCount} referrals
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
