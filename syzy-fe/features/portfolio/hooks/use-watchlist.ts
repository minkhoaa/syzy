"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { apiClient } from "@/lib/kubb";
import { toast } from "sonner";

export interface WatchlistItem {
  id: string;
  marketId: string;
  createdAt: string;
}

interface WatchlistResponse {
  success: boolean;
  data: WatchlistItem[];
}

interface AddWatchlistResponse {
  success: boolean;
  data: WatchlistItem;
}

interface CheckWatchlistResponse {
  success: boolean;
  data: { isWatched: boolean };
}

export function useWatchlist() {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated, user } = useAuthStore();

  // Fetch watchlist
  const {
    data: watchlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["portfolio", "watchlist", user?.walletAddress],
    queryFn: async (): Promise<WatchlistItem[]> => {
      const response = await apiClient.get<WatchlistResponse>("/api/portfolio/watchlist");
      return response.data.data;
    },
    enabled: isAuthenticated && !!accessToken,
    staleTime: 30_000, // 30 seconds
  });

  // Add to watchlist mutation
  const addMutation = useMutation({
    mutationFn: async (marketId: string) => {
      const response = await apiClient.post<AddWatchlistResponse>("/api/portfolio/watchlist", {
        marketId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", "watchlist", user?.walletAddress] });
      toast.success("Added to watchlist");
    },
    onError: (error: Error) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (message?.includes("already in watchlist")) {
        toast.info("Already in watchlist");
      } else {
        toast.error("Failed to add to watchlist");
      }
    },
  });

  // Remove from watchlist mutation
  const removeMutation = useMutation({
    mutationFn: async (marketId: string) => {
      await apiClient.delete(`/api/portfolio/watchlist/${marketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", "watchlist", user?.walletAddress] });
      toast.success("Removed from watchlist");
    },
    onError: () => {
      toast.error("Failed to remove from watchlist");
    },
  });

  // Check if a market is in watchlist
  const isWatched = (marketId: string): boolean => {
    if (!watchlist) return false;
    return watchlist.some((item) => item.marketId === marketId);
  };

  // Toggle watchlist status
  const toggleWatchlist = async (marketId: string) => {
    if (!isAuthenticated) {
      toast.error("Please connect your wallet to use the watchlist");
      return;
    }

    if (isWatched(marketId)) {
      await removeMutation.mutateAsync(marketId);
    } else {
      await addMutation.mutateAsync(marketId);
    }
  };

  return {
    watchlist: watchlist || [],
    isLoading,
    error,
    isWatched,
    addToWatchlist: addMutation.mutate,
    removeFromWatchlist: removeMutation.mutate,
    toggleWatchlist,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

// Hook to check single market watchlist status (for market cards)
export function useIsWatched(marketId: string) {
  const { accessToken, isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", "watchlist", "check", marketId],
    queryFn: async (): Promise<boolean> => {
      const response = await apiClient.get<CheckWatchlistResponse>(
        `/api/portfolio/watchlist/${marketId}/check`
      );
      return response.data.data.isWatched;
    },
    enabled: isAuthenticated && !!accessToken && !!marketId,
    staleTime: 30_000,
  });

  return {
    isWatched: data ?? false,
    isLoading,
  };
}
