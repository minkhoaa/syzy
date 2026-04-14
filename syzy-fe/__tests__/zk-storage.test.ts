import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the zk-api module before importing zk-storage
vi.mock("@/lib/zk-api", () => ({
  zkApi: {
    storeNote: vi.fn().mockResolvedValue(undefined),
    markNoteSpent: vi.fn().mockResolvedValue(undefined),
    getNotes: vi.fn().mockResolvedValue([]),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    storeBatchSnapshot: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/features/auth/store/use-auth-store", () => ({
  useAuthStore: {
    getState: () => ({ isAuthenticated: true }),
  },
}));

// We test the in-memory note cache behavior (no localStorage)
describe("zk-storage in-memory note cache", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it("saveNote adds to cache and avoids duplicates", async () => {
    const { saveNote, getStoredNotes } = await import("@/features/privacy/utils/zk-storage");

    const note = {
      amount: 100000,
      nullifier: "abc123",
      blinding: "def456",
      commitment: "commit1",
      type: "SOL" as const,
      market: "market1",
      poolAddress: "pool1",
      timestamp: Date.now(),
    };

    saveNote(note);
    expect(getStoredNotes()).toHaveLength(1);

    // Adding same commitment should not duplicate
    saveNote(note);
    expect(getStoredNotes()).toHaveLength(1);

    // Different commitment should add
    saveNote({ ...note, commitment: "commit2" });
    expect(getStoredNotes()).toHaveLength(2);
  });

  it("updateNote modifies existing note", async () => {
    const { saveNote, updateNote, getStoredNotes } = await import(
      "@/features/privacy/utils/zk-storage"
    );

    const note = {
      amount: 100000,
      nullifier: "abc",
      blinding: "def",
      commitment: "c1",
      type: "SOL" as const,
      market: "m",
      poolAddress: "p",
      timestamp: Date.now(),
    };

    saveNote(note);
    updateNote("c1", { isSpent: true });

    const stored = getStoredNotes();
    expect(stored[0].isSpent).toBe(true);
    expect(stored[0].amount).toBe(100000);
  });

  it("removeNote removes by nullifier", async () => {
    const { saveNote, removeNote, getStoredNotes } = await import(
      "@/features/privacy/utils/zk-storage"
    );

    const note1 = {
      amount: 100000,
      nullifier: "null1",
      blinding: "b",
      commitment: "c1",
      type: "SOL" as const,
      market: "m",
      poolAddress: "p",
      timestamp: Date.now(),
    };
    const note2 = {
      ...note1,
      nullifier: "null2",
      commitment: "c2",
    };

    saveNote(note1);
    saveNote(note2);
    expect(getStoredNotes()).toHaveLength(2);

    removeNote("null1");
    const remaining = getStoredNotes();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].nullifier).toBe("null2");
  });

  it("clearEncryptionKey clears note cache", async () => {
    const { saveNote, getStoredNotes, clearEncryptionKey } = await import(
      "@/features/privacy/utils/zk-storage"
    );

    saveNote({
      amount: 100000,
      nullifier: "n",
      blinding: "b",
      commitment: "c",
      type: "SOL" as const,
      market: "m",
      poolAddress: "p",
      timestamp: Date.now(),
    });
    expect(getStoredNotes()).toHaveLength(1);

    clearEncryptionKey();
    expect(getStoredNotes()).toHaveLength(0);
  });

  it("syncNoteToBackend saves to cache and calls backend API", async () => {
    const { syncNoteToBackend, getStoredNotes, setEncryptionKey } =
      await import("@/features/privacy/utils/zk-storage");
    const { zkApi } = await import("@/lib/zk-api");

    // Set encryption key so backend sync happens
    await setEncryptionKey("test-signature-for-key-derivation");

    const note = {
      amount: 200000,
      nullifier: "syncNull",
      blinding: "syncBlind",
      commitment: "syncCommit",
      type: "SOL" as const,
      market: "syncMarket",
      poolAddress: "syncPool",
      timestamp: Date.now(),
    };

    await syncNoteToBackend(note, "syncPool");

    // Should be in cache
    expect(getStoredNotes().find((n) => n.commitment === "syncCommit")).toBeTruthy();

    // Should have called backend API
    expect(zkApi.storeNote).toHaveBeenCalledWith(
      expect.objectContaining({
        poolAddress: "syncPool",
        commitment: "syncCommit",
        noteType: "shield",
      })
    );
  });

  it("markNoteAsSpent updates in-memory cache", async () => {
    const { saveNote, markNoteAsSpent, getStoredNotes } =
      await import("@/features/privacy/utils/zk-storage");

    const note = {
      amount: 100000,
      nullifier: "spentNull",
      blinding: "b",
      commitment: "spentCommit",
      type: "SOL" as const,
      market: "m",
      poolAddress: "p",
      timestamp: Date.now(),
    };

    saveNote(note);
    await markNoteAsSpent("spentCommit");

    // Cache should show as spent
    const stored = getStoredNotes();
    expect(stored.find((n) => n.commitment === "spentCommit")?.isSpent).toBe(true);
  });

  it("getStoredNotes returns in-memory array (not from localStorage)", async () => {
    const { saveNote, getStoredNotes } = await import("@/features/privacy/utils/zk-storage");

    // Notes are stored in the in-memory noteCache variable, not localStorage.
    // After module reset, cache starts empty.
    expect(getStoredNotes()).toHaveLength(0);

    saveNote({
      amount: 100000,
      nullifier: "n",
      blinding: "b",
      commitment: "c",
      type: "SOL" as const,
      market: "m",
      poolAddress: "p",
      timestamp: Date.now(),
    });

    // Should be retrievable from the in-memory cache
    expect(getStoredNotes()).toHaveLength(1);
    expect(getStoredNotes()[0].commitment).toBe("c");
  });
});
