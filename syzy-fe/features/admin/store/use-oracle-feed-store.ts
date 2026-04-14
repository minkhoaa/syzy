import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface StoredFeed {
  address: string;
  label?: string;
  metricType?: number;
  metricLabel?: string;
  source: "created" | "imported" | "scanned";
  addedAt: number;
}

interface OracleFeedStoreState {
  feeds: StoredFeed[];
  addFeed: (feed: StoredFeed) => void;
  removeFeed: (address: string) => void;
  updateFeedLabel: (address: string, label: string) => void;
  bulkAddFeeds: (feeds: StoredFeed[]) => void;
}

export const useOracleFeedStore = create<OracleFeedStoreState>()(
  persist(
    (set, get) => ({
      feeds: [],

      addFeed: (feed) => {
        const existing = get().feeds;
        if (existing.some((f) => f.address === feed.address)) return;
        set({ feeds: [...existing, feed] });
      },

      removeFeed: (address) =>
        set({ feeds: get().feeds.filter((f) => f.address !== address) }),

      updateFeedLabel: (address, label) =>
        set({
          feeds: get().feeds.map((f) =>
            f.address === address ? { ...f, label } : f,
          ),
        }),

      bulkAddFeeds: (newFeeds) => {
        const existing = get().feeds;
        const existingAddrs = new Set(existing.map((f) => f.address));
        const toAdd = newFeeds.filter((f) => !existingAddrs.has(f.address));
        if (toAdd.length > 0) {
          set({ feeds: [...existing, ...toAdd] });
        }
      },
    }),
    {
      name: "oyrade-oracle-feeds",
      storage: createJSONStorage(() => localStorage),
      skipHydration: typeof window === "undefined",
    },
  ),
);
