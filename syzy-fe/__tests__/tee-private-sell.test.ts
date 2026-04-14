import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeeClient } from "@/lib/tee-client";

describe("TeeClient.preparePrivateSell", () => {
  let client: TeeClient;

  beforeEach(() => {
    client = new TeeClient("http://localhost:8080");
    vi.restoreAllMocks();
  });

  it("should send correct request and parse successful response", async () => {
    // Mock a base64-encoded partially-signed tx (just some bytes for test)
    const mockTxBase64 = btoa("mock-transaction-bytes");

    const mockResponse = {
      success: true,
      transaction: mockTxBase64,
      total_amount_sold: 500000,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await client.preparePrivateSell({
      notes: [
        { amount: 500000, nullifier: "abc123base58", leaf_index: 42 },
      ],
      market_address: "HEmsoVhRJT4DRmGqZPk136eSLFPNRi6RmMqFNk4eJsVN",
      token_type: 1,
      new_nullifier: "newNullBase58",
      new_blinding: "newBlindBase58",
      min_sol_output: 100000,
      recipient: "UserWalletPubkey111111111111111111111111111",
      fee_payer: "UserWalletPubkey111111111111111111111111111",
    });

    expect(result.success).toBe(true);
    expect(result.transaction).toBe(mockTxBase64);
    expect(result.total_amount_sold).toBe(500000);

    // Verify fetch was called with correct URL and body
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/prepare-batch-sell-unshield",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should parse error response", async () => {
    const mockResponse = {
      success: false,
      error: "shielded pool is not active",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await client.preparePrivateSell({
      notes: [{ amount: 100000, nullifier: "abc", leaf_index: 0 }],
      market_address: "SomeMarket",
      token_type: 1,
      new_nullifier: "n",
      new_blinding: "b",
      min_sol_output: 50000,
      recipient: "R",
      fee_payer: "F",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("shielded pool is not active");
    expect(result.transaction).toBeUndefined();
  });

  it("should handle network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error")
    );

    await expect(
      client.preparePrivateSell({
        notes: [{ amount: 100000, nullifier: "abc", leaf_index: 0 }],
        market_address: "SomeMarket",
        token_type: 1,
        new_nullifier: "n",
        new_blinding: "b",
        min_sol_output: 50000,
        recipient: "R",
        fee_payer: "F",
      })
    ).rejects.toThrow("Network error");
  });

  it("should decode base64 transaction bytes", async () => {
    // Create a known byte sequence
    const originalBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const base64 = btoa(String.fromCharCode(...originalBytes));

    const mockResponse = {
      success: true,
      transaction: base64,
      total_amount_sold: 100000,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await client.preparePrivateSell({
      notes: [{ amount: 100000, nullifier: "abc", leaf_index: 0 }],
      market_address: "M",
      token_type: 2,
      new_nullifier: "n",
      new_blinding: "b",
      min_sol_output: 50000,
      recipient: "R",
      fee_payer: "F",
    });

    // Verify the base64 can be decoded back to original bytes
    const decoded = Uint8Array.from(atob(result.transaction!), (c) =>
      c.charCodeAt(0)
    );
    expect(decoded).toEqual(originalBytes);
  });
});

describe("TeeClient.preparePrivateClaim", () => {
  let client: TeeClient;

  beforeEach(() => {
    client = new TeeClient("http://localhost:8080");
    vi.restoreAllMocks();
  });

  it("should call correct endpoint", async () => {
    const mockResponse = {
      success: true,
      transaction: btoa("mock-claim-tx"),
      total_amount_claimed: 300000,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await client.preparePrivateClaim({
      notes: [{ amount: 300000, nullifier: "claimNull", leaf_index: 10 }],
      market_address: "MarketAddr",
      token_type: 1,
      new_nullifier: "newN",
      new_blinding: "newB",
      recipient: "Recipient",
      fee_payer: "FeePayer",
    });

    expect(result.success).toBe(true);
    expect(result.total_amount_claimed).toBe(300000);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/prepare-batch-claim-unshield",
      expect.anything()
    );
  });
});
