"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, CheckCircle2, XCircle, Copy } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOperations, ConfigStatus } from "@/features/admin/hooks/use-admin-operations";
import { toast } from "sonner";

export function ConfigStatusCard() {
  const { getConfigStatus } = useAdminOperations();
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await getConfigStatus();
      setConfig(status);
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getConfigStatus]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBasisPoints = (bp: number) => {
    return `${(bp / 100).toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Contract Status
              {config?.initialized ? (
                <Badge variant="default" className="bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Initialized
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Initialized
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Current on-chain configuration</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchConfig}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : config ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Authority</span>
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {formatAddress(config.authority)}
                </code>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copyToClipboard(config.authority)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {config.pendingAuthority && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending Authority</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {formatAddress(config.pendingAuthority)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => copyToClipboard(config.pendingAuthority!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Team Wallet</span>
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {formatAddress(config.teamWallet)}
                </code>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copyToClipboard(config.teamWallet)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Buy Fee</span>
                  <span>{formatBasisPoints(config.platformBuyFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Sell Fee</span>
                  <span>{formatBasisPoints(config.platformSellFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LP Buy Fee</span>
                  <span>{formatBasisPoints(config.lpBuyFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LP Sell Fee</span>
                  <span>{formatBasisPoints(config.lpSellFee)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Decimals</span>
                <span>{config.tokenDecimalsConfig}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Min SOL Liquidity</span>
                <span>{(parseInt(config.minSolLiquidity) / 1e9).toFixed(2)} SOL</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Contract not initialized or unavailable
          </div>
        )}
      </CardContent>
    </Card>
  );
}
