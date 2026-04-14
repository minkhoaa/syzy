"use client";

import { useState, useEffect } from "react";
import { Loader2, UserCog, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminOperations } from "@/features/admin/hooks/use-admin-operations";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export function AuthorityTransferCard() {
  const { nominateAuthority, acceptAuthority, getConfigStatus } = useAdminOperations();
  const { user } = useAuthStore();

  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [isNominating, setIsNominating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [pendingAuthority, setPendingAuthority] = useState<string | null>(null);
  const [currentAuthority, setCurrentAuthority] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const config = await getConfigStatus();
      if (config) {
        setPendingAuthority(config.pendingAuthority);
        setCurrentAuthority(config.authority);
      }
    };
    fetchStatus();
  }, [getConfigStatus]);

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleNominate = async () => {
    if (!newAdminAddress) {
      toast.error("Please enter an address");
      return;
    }

    if (!validateAddress(newAdminAddress)) {
      toast.error("Invalid Solana address");
      return;
    }

    setIsNominating(true);
    try {
      const tx = await nominateAuthority(newAdminAddress);
      if (tx) {
        setLastTx(tx);
        setPendingAuthority(newAdminAddress);
        setNewAdminAddress("");
      }
    } catch (error) {
      console.error("Nomination failed:", error);
    } finally {
      setIsNominating(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const tx = await acceptAuthority();
      if (tx) {
        setLastTx(tx);
        setCurrentAuthority(user?.walletAddress ?? null);
        setPendingAuthority(null);
      }
    } catch (error) {
      console.error("Accept failed:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const canAccept = pendingAuthority && user?.walletAddress === pendingAuthority;
  const isCurrentAuthority = user?.walletAddress === currentAuthority;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Authority Transfer
        </CardTitle>
        <CardDescription>
          Transfer admin rights to another wallet (two-step process)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingAuthority && (
          <div className="p-3 bg-teal-500/10 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Pending Authority Transfer</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="font-mono text-xs bg-background/50 px-2 py-1 rounded">
                {pendingAuthority.slice(0, 8)}...{pendingAuthority.slice(-8)}
              </code>
              <Badge variant="secondary">Awaiting Acceptance</Badge>
            </div>
            {canAccept && (
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full mt-2"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept Authority
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {isCurrentAuthority && !pendingAuthority && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">You are the current authority</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Admin Address</label>
              <Input
                placeholder="Enter Solana wallet address"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Two-step transfer process:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>You nominate the new admin</li>
                <li>The new admin must accept the authority</li>
              </ol>
            </div>

            <Button
              onClick={handleNominate}
              disabled={isNominating || !newAdminAddress}
              className="w-full"
            >
              {isNominating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Nominating...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Nominate New Authority
                </>
              )}
            </Button>
          </div>
        )}

        {!isCurrentAuthority && !canAccept && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">
              Only the current authority can transfer admin rights.
            </p>
            {currentAuthority && (
              <p className="text-xs mt-2">
                Current authority:{" "}
                <code className="font-mono">
                  {currentAuthority.slice(0, 8)}...{currentAuthority.slice(-8)}
                </code>
              </p>
            )}
          </div>
        )}

        {lastTx && (
          <div className="text-xs text-muted-foreground">
            <span>Last TX: </span>
            <a
              href={`https://explorer.solana.com/tx/${lastTx}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono"
            >
              {lastTx.slice(0, 16)}...
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
