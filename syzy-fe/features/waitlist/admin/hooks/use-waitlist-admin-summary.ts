"use client";

import { useQuery } from "@tanstack/react-query";
import { waitlistApiClient } from "@/lib/waitlist-kubb";

interface WaitlistSummary {
  allTime: number;
  contactable: number;
  topReferrers: Array<{
    walletAddress: string;
    validReferralCount: number;
    currentRank: number;
  }>;
}

async function fetchSummary(): Promise<WaitlistSummary> {
  const res = await waitlistApiClient.get<WaitlistSummary>("/admin/summary");
  return res.data;
}

export function useWaitlistAdminSummary() {
  return useQuery({
    queryKey: ["waitlist-admin-summary"],
    queryFn: fetchSummary,
    staleTime: 30 * 1000,
  });
}
