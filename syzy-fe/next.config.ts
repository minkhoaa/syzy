import type { NextConfig } from "next";
import path from "path";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === 'true';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/events/:slug',
        destination: '/markets/:slug',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  webpack: IS_MOCK ? (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace @solana/web3.js Connection with a no-op mock (keep PublicKey etc.)
      // First, let the real package be importable under a different name
      '@solana/web3.js-real': require.resolve('@solana/web3.js'),
      // Then replace all imports of @solana/web3.js with our mock
      '@solana/web3.js': path.resolve(__dirname, 'lib/mock/providers/mock-solana-web3.ts'),
      // Replace Reown wallet modules with mocks
      '@reown/appkit/react': path.resolve(__dirname, 'lib/mock/providers/mock-reown-appkit.ts'),
      '@reown/appkit/networks': path.resolve(__dirname, 'lib/mock/providers/mock-reown-networks.ts'),
      '@reown/appkit-adapter-solana/react': path.resolve(__dirname, 'lib/mock/providers/mock-reown-adapter.ts'),
      // Replace provider + auto-login
      '@/providers/solana-provider': path.resolve(__dirname, 'lib/mock/providers/solana-provider.mock.tsx'),
      '@/components/auth/auto-login': path.resolve(__dirname, 'lib/mock/components/auto-login.mock.tsx'),
      // Replace Solana feature hooks with mocks
      '@/features/trading/hooks/use-prediction-market': path.resolve(__dirname, 'lib/mock/hooks/use-prediction-market.mock.ts'),
      '@/features/privacy/hooks/use-zk': path.resolve(__dirname, 'lib/mock/hooks/use-zk.mock.ts'),
      '@/features/staking/hooks/use-staking': path.resolve(__dirname, 'lib/mock/hooks/use-staking.mock.ts'),
      '@/features/trading/hooks/use-negrisk': path.resolve(__dirname, 'lib/mock/hooks/use-negrisk.mock.ts'),
      '@/features/trading/hooks/use-switchboard-feed': path.resolve(__dirname, 'lib/mock/hooks/use-switchboard-feed.mock.ts'),
      '@/features/auth/hooks/use-reown-wallet': path.resolve(__dirname, 'lib/mock/hooks/use-reown-wallet.mock.ts'),
    };
    return config;
  } : undefined,
};

export default nextConfig;
