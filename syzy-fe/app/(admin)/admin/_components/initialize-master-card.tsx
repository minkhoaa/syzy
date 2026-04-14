"use client";

import { useState, useEffect } from "react";
import { Loader2, Rocket, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminOperations } from "@/features/admin/hooks/use-admin-operations";

export function InitializeMasterCard() {
  const { initializeMaster, getConfigStatus } = useAdminOperations();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const config = await getConfigStatus();
      setIsInitialized(config?.initialized ?? false);
    };
    checkStatus();
  }, [getConfigStatus]);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const tx = await initializeMaster();
      if (tx) {
        setLastTx(tx);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Initialize Contract
        </CardTitle>
        <CardDescription>
          Deploy the initial configuration to the contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            This will initialize the prediction market contract with the default
            configuration:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Platform fees: 1% buy, 1% sell</li>
            <li>LP fees: 0.5% buy, 0.5% sell</li>
            <li>Token decimals: 6</li>
            <li>Min liquidity: 0.1 SOL</li>
          </ul>
          <p className="mt-4 text-xs">
            Your wallet will be set as both the authority and team wallet.
          </p>
        </div>

        {isInitialized ? (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Contract is already initialized</span>
          </div>
        ) : (
          <Button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Initialize Config
              </>
            )}
          </Button>
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
