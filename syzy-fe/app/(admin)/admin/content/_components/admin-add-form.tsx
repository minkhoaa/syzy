"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/kubb";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { useEffect, useCallback } from "react";

interface Admin {
  id: string;
  walletAddress: string;
  addedBy: string | null;
  createdAt: string;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as Record<string, unknown>).data as T;
  }
  return payload as T;
}

export function AdminAddForm() {
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/admin/list");
      const data = unwrap<{ admins: Admin[] }>(res.data);
      setAdmins(data.admins);
    } catch {
      console.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/api/admin/add/${wallet.trim()}`);
      toast.success("Admin added!");
      setWallet("");
      fetchAdmins();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to add admin";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (address: string) => {
    if (!confirm(`Remove admin ${address.slice(0, 8)}...${address.slice(-8)}?`)) return;
    setRemoving(address);
    try {
      await apiClient.delete(`/api/admin/remove/${address}`);
      toast.success("Admin removed");
      fetchAdmins();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to remove admin";
      toast.error(message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="admin-wallet">Wallet Address</Label>
          <Input
            id="admin-wallet"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Solana wallet address..."
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <UserPlus className="w-4 h-4 mr-2" />
          )}
          Add Admin
        </Button>
      </form>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Current Admins</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No admins found.</p>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-mono truncate">{admin.walletAddress}</span>
                  {!admin.addedBy && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                      Owner
                    </span>
                  )}
                </div>
                {admin.addedBy && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(admin.walletAddress)}
                    disabled={removing === admin.walletAddress}
                  >
                    {removing === admin.walletAddress ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
