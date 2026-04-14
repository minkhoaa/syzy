"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  UserPlus,
  Trash2,
  RefreshCw,
  Shield,
  Key,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { useAdminOperations } from "@/features/admin/hooks/use-admin-operations";
import { useAppKitAccount } from "@reown/appkit/react";

export function TeeRegistryCard() {
  const { address } = useAppKitAccount();
  const {
    initializeTeeRegistry,
    registerTee,
    deregisterTee,
    setSp1VkeyFromHex,
    setSp1Vkey,
    getTeeRegistryStatus,
    getSp1VkeyHash,
  } = useAdminOperations();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [removingOp, setRemovingOp] = useState<string | null>(null);
  const [isSettingVkey, setIsSettingVkey] = useState(false);

  const [registryStatus, setRegistryStatus] = useState<{
    initialized: boolean;
    operators: string[];
    operatorCount: number;
  }>({ initialized: false, operators: [], operatorCount: 0 });

  const [sp1VkeyHash, setSp1VkeyHashState] = useState<string>("");
  const [newOperatorAddress, setNewOperatorAddress] = useState("");
  const [vkeyInput, setVkeyInput] = useState("");

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const [status, vkey] = await Promise.all([
        getTeeRegistryStatus(),
        getSp1VkeyHash().catch(() => ""),
      ]);
      setRegistryStatus(status);
      setSp1VkeyHashState(vkey);
    } catch (error) {
      console.error("Failed to fetch TEE registry status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getTeeRegistryStatus, getSp1VkeyHash]);

  useEffect(() => {
    if (address) fetchStatus();
  }, [address, fetchStatus]);

  const validateAddress = (addr: string): boolean => {
    try {
      new PublicKey(addr);
      return true;
    } catch {
      return false;
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initializeTeeRegistry();
      await fetchStatus();
    } catch {
      // Error already toasted by hook
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRegister = async () => {
    if (!newOperatorAddress) {
      toast.error("Please enter an operator address");
      return;
    }
    if (!validateAddress(newOperatorAddress)) {
      toast.error("Invalid Solana address");
      return;
    }
    if (registryStatus.operators.includes(newOperatorAddress)) {
      toast.error("Operator already registered");
      return;
    }

    setIsRegistering(true);
    try {
      await registerTee(new PublicKey(newOperatorAddress));
      setNewOperatorAddress("");
      await fetchStatus();
    } catch {
      // Error already toasted by hook
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeregister = async (operatorAddr: string) => {
    setRemovingOp(operatorAddr);
    try {
      await deregisterTee(new PublicKey(operatorAddr));
      await fetchStatus();
    } catch {
      // Error already toasted by hook
    } finally {
      setRemovingOp(null);
    }
  };

  const handleSetVkey = async () => {
    if (!vkeyInput) {
      toast.error("Please enter a vkey hash");
      return;
    }
    setIsSettingVkey(true);
    try {
      await setSp1VkeyFromHex(vkeyInput);
      setVkeyInput("");
      await fetchStatus();
    } catch {
      // Error already toasted by hook
    } finally {
      setIsSettingVkey(false);
    }
  };

  const handleSetDevMode = async () => {
    setIsSettingVkey(true);
    try {
      await setSp1Vkey(Array(32).fill(0));
      await fetchStatus();
    } catch {
      // Error already toasted by hook
    } finally {
      setIsSettingVkey(false);
    }
  };

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  const isDevMode = sp1VkeyHash === "0x" + "00".repeat(32);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              TEE Registry
            </CardTitle>
            <CardDescription>
              Manage TEE operators and SP1 verification key
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchStatus}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Registry Status */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          ) : registryStatus.initialized ? (
            <p className="text-sm text-green-600">
              Initialized ({registryStatus.operators.length} operators)
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-yellow-600">Not initialized</p>
              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                size="sm"
              >
                {isInitializing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Initialize Registry
              </Button>
            </div>
          )}
        </div>

        {registryStatus.initialized && (
          <>
            {/* Register Operator */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Register Operator</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Operator pubkey"
                  value={newOperatorAddress}
                  onChange={(e) => setNewOperatorAddress(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleRegister}
                  disabled={isRegistering || !newOperatorAddress}
                  size="sm"
                >
                  {isRegistering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Operator List */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Registered Operators ({registryStatus.operators.length})
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {registryStatus.operators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No operators registered
                  </p>
                ) : (
                  registryStatus.operators.map((op) => (
                    <div
                      key={op}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <code className="font-mono text-xs">
                        {formatAddress(op)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeregister(op)}
                        disabled={removingOp === op}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        {removingOp === op ? (
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

            {/* SP1 VKey Hash */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                SP1 VKey Hash
              </label>
              {sp1VkeyHash && (
                <div className="p-2 bg-muted/50 rounded-lg">
                  <code className="font-mono text-xs break-all">
                    {sp1VkeyHash}
                  </code>
                  {isDevMode && (
                    <span className="ml-2 text-xs text-yellow-600 font-medium">
                      (dev mode)
                    </span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="0x... (64 hex chars)"
                  value={vkeyInput}
                  onChange={(e) => setVkeyInput(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleSetVkey}
                  disabled={isSettingVkey || !vkeyInput}
                  size="sm"
                >
                  {isSettingVkey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Set"
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetDevMode}
                disabled={isSettingVkey || isDevMode}
                className="w-full"
              >
                {isDevMode ? "Already in Dev Mode" : "Set Dev Mode (all zeros)"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
