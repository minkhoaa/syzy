// Replaces @reown/appkit-adapter-solana/react
// The real SolanaAdapter wraps wallet adapters for Reown AppKit.
// In mock mode we just need a class that can be instantiated.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SolanaAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_config?: any) {
    // no-op
  }
}
