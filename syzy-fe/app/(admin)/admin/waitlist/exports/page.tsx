'use client';

import { RequireWaitlistAdmin } from "@/features/waitlist/admin/components/require-waitlist-admin";
import { useWaitlistAdminExport } from "@/features/waitlist/admin/hooks/use-waitlist-admin-export";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export default function WaitlistExportsPage() {
  return (
    <RequireWaitlistAdmin>
      <WaitlistExportsContent />
    </RequireWaitlistAdmin>
  );
}

function WaitlistExportsContent() {
  const exportMutation = useWaitlistAdminExport();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Exports</h1>
        <p className="text-muted-foreground mt-1">
          Download waitlist data for outreach or analysis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Full export (CSV)</h2>
          <p className="text-sm text-muted-foreground">
            Export all waitlist entries with wallet, referral, contact, and queue data.
          </p>
          <Button
            onClick={() =>
              exportMutation.mutate({ format: "csv", filters: {} })
            }
            disabled={exportMutation.isPending}
            className="bg-primary hover:bg-teal-600"
          >
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exportMutation.isPending ? "Preparing..." : "Download CSV"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Contactable only (CSV)</h2>
          <p className="text-sm text-muted-foreground">
            Export only entries with an attached email address.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              exportMutation.mutate({
                format: "csv",
                filters: { contactableOnly: true },
              })
            }
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exportMutation.isPending ? "Preparing..." : "Download contactable"}
          </Button>
        </div>
      </div>

      {exportMutation.isSuccess && exportMutation.data && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            Export ready:{" "}
            <a href={exportMutation.data} className="underline">
              Download
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
