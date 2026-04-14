"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, UserPlus, Trash2, Users, RefreshCw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/kubb";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/use-auth-store";

interface Admin {
  id: string;
  walletAddress: string;
  addedBy: string | null;
  createdAt: string;
}

export function AdminManagementCard() {
  const { user } = useAuthStore();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/admin/list");
      const data = response.data?.data ?? response.data;
      setAdmins(data?.admins || []);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      toast.error("Failed to load admin list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    if (!validateAddress(newAdminAddress)) {
      toast.error("Invalid Solana address");
      return;
    }

    // Check if already an admin
    if (admins.some((a) => a.walletAddress === newAdminAddress)) {
      toast.error("This wallet is already an admin");
      return;
    }

    setIsAdding(true);
    try {
      await apiClient.post(`/api/admin/add/${newAdminAddress}`);
      toast.success("Admin added successfully");
      setNewAdminAddress("");
      fetchAdmins();
    } catch (error) {
      console.error("Failed to add admin:", error);
      toast.error("Failed to add admin");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async (admin: Admin) => {
    // Prevent removing yourself
    if (admin.walletAddress === user?.walletAddress) {
      toast.error("You cannot remove yourself");
      return;
    }

    // Prevent removing the last admin
    if (admins.length <= 1) {
      toast.error("Cannot remove the last admin");
      return;
    }

    setRemovingId(admin.id);
    try {
      await apiClient.delete(`/api/admin/remove/${admin.walletAddress}`);
      toast.success("Admin removed successfully");
      fetchAdmins();
    } catch (error) {
      console.error("Failed to remove admin:", error);
      toast.error("Failed to remove admin");
    } finally {
      setRemovingId(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Management
            </CardTitle>
            <CardDescription>
              Manage wallet addresses with admin access
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchAdmins}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Admin */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add New Admin</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Solana wallet address"
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              onClick={handleAddAdmin}
              disabled={isAdding || !newAdminAddress}
              size="sm"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Admin List */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Current Admins ({admins.length})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No admins found
              </p>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs">
                      {formatAddress(admin.walletAddress)}
                    </code>
                    {admin.walletAddress === user?.walletAddress && (
                      <span className="text-xs text-primary">(you)</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveAdmin(admin)}
                    disabled={
                      removingId === admin.id ||
                      admin.walletAddress === user?.walletAddress ||
                      admins.length <= 1
                    }
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    {removingId === admin.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
