"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ZK_NOTES_CHANGED_EVENT, getStoredNotes } from "@/features/privacy/utils/zk-storage";

// Track note version for reactivity
let notesVersion = 0;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);

  // Also listen to the custom event
  const handleChange = () => {
    notesVersion++;
    callback();
  };

  if (typeof window !== "undefined") {
    window.addEventListener(ZK_NOTES_CHANGED_EVENT, handleChange);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener(ZK_NOTES_CHANGED_EVENT, handleChange);
    }
  };
}

function getSnapshot() {
  return notesVersion;
}

function getServerSnapshot() {
  return 0;
}

/**
 * Hook to subscribe to ZK notes changes.
 * Automatically updates when notes are added, updated, or synced from backend.
 */
export function useZkNotes(marketAddress?: string) {
  // Subscribe to version changes for reactivity
  const version = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Get notes from storage - this will re-run when version changes
  const allNotes = getStoredNotes();

  // Filter notes based on marketAddress
  const tokenNotes = marketAddress
    ? allNotes.filter(
        (n) => n.market === marketAddress && n.type !== "SOL" && !n.isSpent
      )
    : allNotes.filter((n) => n.type !== "SOL" && !n.isSpent);

  const solNotes = allNotes.filter((n) => n.type === "SOL" && !n.isSpent);
  const yesNotes = tokenNotes.filter((n) => n.type === "YES");
  const noNotes = tokenNotes.filter((n) => n.type === "NO");

  // Manual refresh function (triggers all listeners)
  const refreshNotes = useCallback(() => {
    notesVersion++;
    listeners.forEach((listener) => listener());
  }, []);

  return {
    notes: allNotes,
    solNotes,
    tokenNotes,
    yesNotes,
    noNotes,
    refreshNotes,
    version,
  };
}
