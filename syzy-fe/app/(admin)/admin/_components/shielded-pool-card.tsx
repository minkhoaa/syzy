"use client";

import { useState, useEffect } from "react";
import { Loader2, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAdminOperations } from "@/features/admin/hooks/use-admin-operations";
import { usePredictionMarket } from "@/features/trading/hooks/use-prediction-market";
import type { MarketAccount } from "@/types/prediction-market.types";

interface MarketWithPda {
  publicKey: PublicKey;
  account: MarketAccount;
}

export function ShieldedPoolCard() {
  const { initializeShieldedPool, initializeNullifierShards, checkShieldedPoolExists } =
    useAdminOperations();
  const { getAllMarkets } = usePredictionMarket();

  const [markets, setMarkets] = useState<MarketWithPda[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);
  const [isInitializingPool, setIsInitializingPool] = useState(false);
  const [isInitializingShards, setIsInitializingShards] = useState(false);
  const [lastIdentifier, setLastIdentifier] = useState<Uint8Array | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!getAllMarkets) {
        setIsLoadingMarkets(false);
        return;
      }
      setIsLoadingMarkets(true);
      try {
        const allMarkets = await getAllMarkets();
        setMarkets(allMarkets);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setIsLoadingMarkets(false);
      }
    };
    fetchMarkets();
  }, [getAllMarkets]);

  useEffect(() => {
    const checkPool = async () => {
      if (!selectedMarket) {
        setPoolExists(null);
        return;
      }
      try {
        const marketPda = new PublicKey(selectedMarket);
        const exists = await checkShieldedPoolExists(marketPda);
        setPoolExists(exists);
      } catch {
        setPoolExists(null);
      }
    };
    checkPool();
  }, [selectedMarket, checkShieldedPoolExists]);

  const handleInitPool = async () => {
    if (!selectedMarket) return;

    setIsInitializingPool(true);
    try {
      const marketPda = new PublicKey(selectedMarket);
      const result = await initializeShieldedPool(marketPda);
      if (result) {
        setLastTx(result.signature);
        setLastIdentifier(result.identifier);
        setPoolExists(true);
      }
    } catch (error) {
      console.error("Failed to init pool:", error);
    } finally {
      setIsInitializingPool(false);
    }
  };

  const handleInitShards = async () => {
    if (!selectedMarket || !lastIdentifier) return;

    setIsInitializingShards(true);
    try {
      const marketPda = new PublicKey(selectedMarket);
      const tx = await initializeNullifierShards(marketPda, lastIdentifier);
      if (tx) {
        setLastTx(tx);
      }
    } catch (error) {
      console.error("Failed to init shards:", error);
    } finally {
      setIsInitializingShards(false);
    }
  };

  const selectedMarketData = markets.find(
    (m) => m.publicKey.toString() === selectedMarket
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          ZK Shielded Pools
        </CardTitle>
        <CardDescription>
          Initialize privacy pools for prediction markets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Market</label>
          <Select
            value={selectedMarket ?? undefined}
            onValueChange={setSelectedMarket}
            disabled={isLoadingMarkets}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingMarkets ? "Loading markets..." : "Choose a market"} />
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem
                  key={market.publicKey.toString()}
                  value={market.publicKey.toString()}
                >
                  <div className="flex items-center gap-2">
                    <span>{market.account.marketName || "Unnamed Market"}</span>
                    <code className="text-xs text-muted-foreground">
                      {market.publicKey.toString().slice(0, 8)}...
                    </code>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMarket && (
          <div className="space-y-3">
            {selectedMarketData && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market</span>
                  <span className="font-medium">
                    {selectedMarketData.account.marketName || "Unnamed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {selectedMarketData.account.isCompleted ? (
                    <Badge variant="secondary">Resolved</Badge>
                  ) : (
                    <Badge>Active</Badge>
                  )}
                </div>
              </div>
            )}

            {poolExists === true && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Shielded pool already exists</span>
              </div>
            )}

            {poolExists === false && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-teal-500/10 rounded-lg text-teal-600 dark:text-teal-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">No shielded pool found</span>
                </div>

                <Button
                  onClick={handleInitPool}
                  disabled={isInitializingPool}
                  className="w-full"
                >
                  {isInitializingPool ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initializing Pool...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Initialize Shielded Pool
                    </>
                  )}
                </Button>
              </div>
            )}

            {poolExists === true && lastIdentifier && (
              <Button
                onClick={handleInitShards}
                disabled={isInitializingShards}
                variant="outline"
                className="w-full"
              >
                {isInitializingShards ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing Shards...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Initialize Nullifier Shards
                  </>
                )}
              </Button>
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
