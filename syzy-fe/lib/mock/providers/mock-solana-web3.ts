/**
 * Mock @solana/web3.js — re-exports everything from the real package
 * except Connection, which is replaced with a no-op version that
 * never touches the network.
 */

// Re-export everything from the real package
export * from '@solana/web3.js-real';

// Override Connection with a mock that returns dummy data
export class Connection {
  private _rpcEndpoint: string;

  constructor(endpoint: string, _commitmentOrConfig?: unknown) {
    this._rpcEndpoint = endpoint;
  }

  get rpcEndpoint() {
    return this._rpcEndpoint;
  }

  async getBalance() {
    return 12_500_000_000; // 12.5 SOL in lamports
  }

  async getTokenAccountBalance() {
    return {
      value: {
        amount: '1000000000',
        decimals: 6,
        uiAmount: 1000,
        uiAmountString: '1000',
      },
      context: { slot: 999999 },
    };
  }

  async getAccountInfo() {
    return null;
  }

  async getMultipleAccountsInfo(keys: unknown[]) {
    return keys.map(() => null);
  }

  async getParsedTokenAccountsByOwner() {
    return { value: [] };
  }

  async getTokenAccountsByOwner() {
    return { value: [] };
  }

  async getLatestBlockhash() {
    return {
      blockhash: 'MockBlockhash' + Date.now().toString(36),
      lastValidBlockHeight: 999999,
    };
  }

  async getSlot() {
    return 999999;
  }

  async getMinimumBalanceForRentExemption() {
    return 890880;
  }

  async sendRawTransaction() {
    return 'MockTxSig' + Math.random().toString(36).slice(2);
  }

  async sendTransaction() {
    return 'MockTxSig' + Math.random().toString(36).slice(2);
  }

  async confirmTransaction() {
    return { value: { err: null }, context: { slot: 999999 } };
  }

  async getSignatureStatuses() {
    return { value: [{ confirmationStatus: 'confirmed', err: null }] };
  }

  async getTransaction() {
    return null;
  }

  async getParsedTransaction() {
    return null;
  }

  async getRecentBlockhash() {
    return {
      blockhash: 'MockBlockhash' + Date.now().toString(36),
      feeCalculator: { lamportsPerSignature: 5000 },
    };
  }

  async getProgramAccounts() {
    return [];
  }

  async getTokenLargestAccounts() {
    return { value: [] };
  }

  async getTokenSupply() {
    return {
      value: { amount: '0', decimals: 6, uiAmount: 0, uiAmountString: '0' },
      context: { slot: 999999 },
    };
  }

  async requestAirdrop() {
    return 'MockAirdropSig' + Math.random().toString(36).slice(2);
  }

  async getVersion() {
    return { 'solana-core': '1.18.0', 'feature-set': 0 };
  }

  async getBlockHeight() {
    return 999999;
  }

  async getFeeForMessage() {
    return { value: 5000 };
  }

  async getSignaturesForAddress() {
    return [];
  }

  async simulateTransaction() {
    return { value: { err: null, logs: [] }, context: { slot: 999999 } };
  }

  onAccountChange() {
    return 0; // subscription id
  }

  removeAccountChangeListener() {
    // no-op
  }

  onProgramAccountChange() {
    return 0;
  }

  removeProgramAccountChangeListener() {
    // no-op
  }

  onSlotChange() {
    return 0;
  }

  removeSlotChangeListener() {
    // no-op
  }

  onLogs() {
    return 0;
  }

  removeOnLogsListener() {
    // no-op
  }
}
