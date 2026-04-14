"use client";

import { useState } from 'react';

export interface TransactionData {
  amount: string;
  market: string;
  position: 'Yes' | 'No';
  isShielded: boolean;
  eventId: string;
  marketId: string;
}

export function useWalletTransaction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateWalletPopup = async (transactionData: TransactionData): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Skip wallet popup completely for mock flow
      // Just simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Always succeed for mock flow (100% success rate)
      const success = true;
      
      if (!success) {
        throw new Error('Transaction failed on blockchain');
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => setError(null);

  return {
    simulateWalletPopup,
    isProcessing,
    error,
    clearError,
  };
}