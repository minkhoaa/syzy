"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useAdminControllerCheckAdmin } from "@/lib/api-client/hooks/use-admin-controller-check-admin";

export function useIsAdmin() {
  const { address } = useAppKitAccount();

  const { data, isLoading } = useAdminControllerCheckAdmin(address ?? "", {
    query: { enabled: !!address },
  });

  const isAdmin =
    !!data && typeof data === "object" && "data" in data
      ? !!(data as { data?: { isAdmin?: boolean } }).data?.isAdmin
      : false;

  return { isAdmin, isLoading };
}
