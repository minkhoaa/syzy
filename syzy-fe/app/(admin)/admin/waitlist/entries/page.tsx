"use client";

import { useState } from "react";
import { RequireWaitlistAdmin } from "@/features/waitlist/admin/components/require-waitlist-admin";
import { useWaitlistAdminEntries } from "@/features/waitlist/admin/hooks/use-waitlist-admin-entries";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function WaitlistEntriesPage() {
  return (
    <RequireWaitlistAdmin>
      <WaitlistEntriesContent />
    </RequireWaitlistAdmin>
  );
}

function WaitlistEntriesContent() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useWaitlistAdminEntries(search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Waitlist Entries</h1>
        <p className="text-muted-foreground mt-1">
          {data?.total?.toLocaleString() ?? "—"} total entries
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by wallet address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && <div className="text-muted-foreground">Loading entries...</div>}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          Failed to load entries.
        </div>
      )}

      {data && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rank</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wallet</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referrals</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">#{entry.currentRank}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                  </td>
                  <td className="px-4 py-3 text-primary font-medium">
                    {entry.validReferralCount}
                  </td>
                  <td className="px-4 py-3 font-mono">{entry.queueScore}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(entry.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
