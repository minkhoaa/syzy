// Replaces @reown/appkit/networks
// Exports all symbols used by both our code AND node_modules (e.g. @walletconnect/solana-adapter)

const makeNetwork = (id: string, name: string, chainId: string, rpc: string) => ({
  id,
  name,
  chainId,
  rpcUrls: { default: { http: [rpc] } },
})

export const solanaDevnet = makeNetwork('solana:devnet', 'Solana Devnet', 'devnet', 'https://api.devnet.solana.com')
export const solanaMainnet = makeNetwork('solana:mainnet', 'Solana', 'mainnet-beta', 'https://api.mainnet-beta.solana.com')
export const solanaTestnet = makeNetwork('solana:testnet', 'Solana Testnet', 'testnet', 'https://api.testnet.solana.com')

// @walletconnect/solana-adapter imports `solana` as the mainnet alias
export const solana = solanaMainnet

export type AppKitNetwork = typeof solanaDevnet
