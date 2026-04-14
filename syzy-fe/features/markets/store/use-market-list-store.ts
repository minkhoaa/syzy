import { create } from "zustand";
import type { MarketItem } from "@/features/markets/hooks/use-market-list";

interface MarketListState {
  markets: MarketItem[];
  isLoading: boolean;
  lastFetchedAt: number;
  setMarkets: (markets: MarketItem[]) => void;
  setLoading: (loading: boolean) => void;
  setLastFetchedAt: (ts: number) => void;
}

export const useMarketListStore = create<MarketListState>((set) => ({
  markets: [],
  isLoading: true,
  lastFetchedAt: 0,
  setMarkets: (markets) => set({ markets }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastFetchedAt: (ts) => set({ lastFetchedAt: ts }),
}));
