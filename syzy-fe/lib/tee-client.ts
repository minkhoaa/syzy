// TEE Service HTTP Client
// Communicates with the TEE Rust service for batch shielded operations

const TEE_BASE_URL =
  process.env.NEXT_PUBLIC_TEE_SERVICE_URL || "http://localhost:8080";

export interface NoteInput {
  amount: number;
  nullifier: string; // base58
  leaf_index: number;
}

export interface BatchSellRequest {
  notes: NoteInput[];
  market_address: string;
  token_type: number; // 1=YES, 2=NO (matches on-chain convention)
  new_nullifier: string; // base58
  new_blinding: string; // base58
  min_sol_output: number;
}

export interface BatchClaimRequest {
  notes: NoteInput[];
  market_address: string;
  token_type: number;
  new_nullifier: string; // base58 — for output SOL commitment
  new_blinding: string; // base58 — for output SOL commitment
}

export interface BatchSellResponse {
  success: boolean;
  tx_signature?: string;
  total_amount_sold?: number;
  new_commitment?: string; // hex-encoded 32-byte commitment
  leaf_index?: number;
  error?: string;
}

export interface BatchClaimResponse {
  success: boolean;
  tx_signature?: string;
  total_amount_claimed?: number;
  new_commitment?: string; // hex-encoded 32-byte commitment
  leaf_index?: number;
  error?: string;
}

export interface BatchSellUnshieldRequest {
  notes: NoteInput[];
  market_address: string;
  token_type: number;
  new_nullifier: string; // base58
  new_blinding: string; // base58
  min_sol_output: number;
  recipient: string; // wallet address to receive SOL directly
}

export interface BatchClaimUnshieldRequest {
  notes: NoteInput[];
  market_address: string;
  token_type: number;
  new_nullifier: string; // base58
  new_blinding: string; // base58
  recipient: string; // wallet address to receive SOL directly
}

export interface BatchSellUnshieldResponse {
  success: boolean;
  tx_signature?: string;
  total_amount_sold?: number;
  error?: string;
}

export interface BatchClaimUnshieldResponse {
  success: boolean;
  tx_signature?: string;
  total_amount_claimed?: number;
  error?: string;
}

export interface PrepareSellRequest {
  notes: NoteInput[];
  market_address: string;
  token_type: number; // 1=YES, 2=NO
  new_nullifier: string; // base58
  new_blinding: string; // base58
  min_sol_output: number;
  recipient: string; // wallet address to receive SOL
  fee_payer: string; // wallet address that pays tx fee and co-signs
}

export interface PrepareSellResponse {
  success: boolean;
  transaction?: string; // base64-encoded partially-signed tx
  total_amount_sold?: number;
  error?: string;
}

export interface PrepareClaimRequest {
  notes: NoteInput[];
  market_address: string;
  token_type: number;
  new_nullifier: string; // base58
  new_blinding: string; // base58
  recipient: string; // wallet address to receive SOL
  fee_payer: string; // wallet address that pays tx fee and co-signs
}

export interface PrepareClaimResponse {
  success: boolean;
  transaction?: string; // base64-encoded partially-signed tx
  total_amount_claimed?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  sp1_prover: string;
  rpc_connected: boolean;
}

export class TeeClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || TEE_BASE_URL;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 300_000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async batchSell(request: BatchSellRequest): Promise<BatchSellResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/batch-sell`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  }

  async batchClaim(request: BatchClaimRequest): Promise<BatchClaimResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/batch-claim`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  }

  async batchSellUnshield(
    request: BatchSellUnshieldRequest,
  ): Promise<BatchSellUnshieldResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/batch-sell-unshield`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  }

  async batchClaimUnshield(
    request: BatchClaimUnshieldRequest,
  ): Promise<BatchClaimUnshieldResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/batch-claim-unshield`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  }

  async preparePrivateSell(
    request: PrepareSellRequest,
  ): Promise<PrepareSellResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/prepare-batch-sell-unshield`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  }

  async preparePrivateClaim(
    request: PrepareClaimRequest,
  ): Promise<PrepareClaimResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/prepare-batch-claim-unshield`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    return response.json();
  }

  async health(): Promise<HealthResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/health`,
        {},
        10_000,
      );
      return response.json();
    } catch {
      return {
        status: "unavailable",
        sp1_prover: "unknown",
        rpc_connected: false,
      };
    }
  }
}

export const teeClient = new TeeClient();
