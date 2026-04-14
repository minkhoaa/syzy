"use client";

import { useMutation } from "@tanstack/react-query";
import { waitlistApiClient } from "@/lib/waitlist-kubb";

interface ExportRequest {
  format: "csv" | "json";
  filters?: {
    contactableOnly?: boolean;
    joinedAfter?: string;
    joinedBefore?: string;
  };
}

async function triggerExport(req: ExportRequest): Promise<string> {
  const res = await waitlistApiClient.post<{ downloadUrl: string }>(
    "/admin/exports",
    req,
  );
  return res.data.downloadUrl;
}

export function useWaitlistAdminExport() {
  return useMutation({
    mutationFn: triggerExport,
  });
}
