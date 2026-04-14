"use client";

// React hook for TEE batch operations
// Wraps tee-client with state management and error handling

import { useState, useEffect, useCallback } from "react";
import {
  teeClient,
  type BatchSellRequest,
  type BatchSellResponse,
  type BatchClaimRequest,
  type BatchClaimResponse,
  type BatchSellUnshieldRequest,
  type BatchSellUnshieldResponse,
  type BatchClaimUnshieldRequest,
  type BatchClaimUnshieldResponse,
  type PrepareSellRequest,
  type PrepareSellResponse,
  type PrepareClaimRequest,
  type PrepareClaimResponse,
} from "@/lib/tee-client";

export function useTee() {
  const [teeAvailable, setTeeAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check TEE health on mount
  useEffect(() => {
    teeClient.health().then((health) => {
      setTeeAvailable(health.status === "ok");
    });
  }, []);

  const batchSell = useCallback(
    async (request: BatchSellRequest): Promise<BatchSellResponse> => {
      setLoading(true);
      try {
        const result = await teeClient.batchSell(request);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const batchClaim = useCallback(
    async (request: BatchClaimRequest): Promise<BatchClaimResponse> => {
      setLoading(true);
      try {
        const result = await teeClient.batchClaim(request);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const batchSellUnshield = useCallback(
    async (request: BatchSellUnshieldRequest): Promise<BatchSellUnshieldResponse> => {
      setLoading(true);
      try {
        const result = await teeClient.batchSellUnshield(request);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const batchClaimUnshield = useCallback(
    async (request: BatchClaimUnshieldRequest): Promise<BatchClaimUnshieldResponse> => {
      setLoading(true);
      try {
        const result = await teeClient.batchClaimUnshield(request);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const preparePrivateSell = useCallback(
    async (request: PrepareSellRequest): Promise<PrepareSellResponse> => {
      setLoading(true);
      try {
        const result = await teeClient.preparePrivateSell(request);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const preparePrivateClaim = useCallback(
    async (request: PrepareClaimRequest): Promise<PrepareClaimResponse> => {
      setLoading(true);
      try {
        const result = await teeClient.preparePrivateClaim(request);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    teeAvailable,
    loading,
    batchSell,
    batchClaim,
    batchSellUnshield,
    batchClaimUnshield,
    preparePrivateSell,
    preparePrivateClaim,
  };
}
