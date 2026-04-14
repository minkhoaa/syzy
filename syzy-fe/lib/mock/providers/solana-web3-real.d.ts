// Type declaration for webpack alias — in mock mode, @solana/web3.js-real
// resolves to the real @solana/web3.js package.
declare module '@solana/web3.js-real' {
  export * from '@solana/web3.js';
}
