"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/kubb";

export interface TrackEventParams {
  eventType:
    | "SIGNUP"
    | "WALLET_CONNECT"
    | "TRADE_INITIATED"
    | "TRADE_CONFIRMED"
    | "TRADE_FAILED";
  walletAddress: string;
  marketId?: string;
  metadata?: Record<string, unknown>;
}

export interface TradeMetadata {
  amount?: number;
  solAmount?: number;
  direction?: "BUY" | "SELL";
  tokenType?: "YES" | "NO";
  isSolAmount?: boolean;
  txSignature?: string;
  errorMessage?: string;
}

export function useMetrics() {
  /**
   * Track a generic analytics event (fire-and-forget)
   */
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    try {
      // Fire-and-forget - don't await in caller
      await apiClient.post("/api/metrics/track", params);
      console.debug("[Metrics] Event tracked:", params.eventType);
    } catch (error) {
      // Log errors in development for debugging, silent in production
      if (process.env.NODE_ENV === "development") {
        console.warn("[Metrics] Failed to track event:", params.eventType, error);
      }
    }
  }, []);

  /**
   * Track wallet connect event
   */
  const trackWalletConnect = useCallback(
    (walletAddress: string) => {
      trackEvent({
        eventType: "WALLET_CONNECT",
        walletAddress,
      });
    },
    [trackEvent]
  );

  /**
   * Track trade initiated (user started the trade flow)
   */
  const trackTradeInitiated = useCallback(
    (walletAddress: string, marketId: string, metadata?: TradeMetadata) => {
      trackEvent({
        eventType: "TRADE_INITIATED",
        walletAddress,
        marketId,
        metadata: metadata as Record<string, unknown> | undefined,
      });
    },
    [trackEvent]
  );

  /**
   * Track trade confirmed (transaction succeeded)
   */
  const trackTradeConfirmed = useCallback(
    (
      walletAddress: string,
      marketId: string,
      txSignature: string,
      metadata?: TradeMetadata
    ) => {
      trackEvent({
        eventType: "TRADE_CONFIRMED",
        walletAddress,
        marketId,
        metadata: {
          ...(metadata as Record<string, unknown>),
          txSignature,
        },
      });
    },
    [trackEvent]
  );

  /**
   * Track trade failed (transaction failed or was rejected)
   */
  const trackTradeFailed = useCallback(
    (
      walletAddress: string,
      marketId: string,
      errorMessage: string,
      metadata?: TradeMetadata
    ) => {
      trackEvent({
        eventType: "TRADE_FAILED",
        walletAddress,
        marketId,
        metadata: {
          ...(metadata as Record<string, unknown>),
          errorMessage,
        },
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackWalletConnect,
    trackTradeInitiated,
    trackTradeConfirmed,
    trackTradeFailed,
  };
}
