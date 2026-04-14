"use client";

import { useQuery } from "@tanstack/react-query";
import { waitlistApiClient } from "@/lib/waitlist-kubb";

export interface WaitlistEntry {
  id: string;
  walletAddress: string;
  referralCode: string;
  email: string | null;
  isContactable: boolean;
  validReferralCount: number;
  queueScore: number;
  currentRank: number;
  currentPercentile: number;
  joinedAt: string;
  referredByCode: string | null;
}

interface EntriesResponse {
  entries: WaitlistEntry[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchEntries(search = "", page = 1): Promise<EntriesResponse> {
  const res = await waitlistApiClient.get<EntriesResponse>("/admin/entries", {
    params: { search, page, pageSize: 50 },
  });
  return res.data;
}

export function useWaitlistAdminEntries(search = "") {
  return useQuery({
    queryKey: ["waitlist-admin-entries", search],
    queryFn: () => fetchEntries(search),
    staleTime: 15 * 1000,
  });
}
