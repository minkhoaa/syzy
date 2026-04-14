/**
 * Mock handlers for analytics, token-data, and tracking endpoints
 *
 * POST /api/metrics/track
 * GET  /api/token-data/:mint/overview
 * GET  /api/token-data/global/stats
 * GET  /api/token-data/:mint/ohlcv
 * GET  /api/token-data/binance/tokens
 * GET  /api/token-data/:mint/holders
 */

import { success } from '../utils';

export function handleTrackEvent() {
  // No-op — silently accept tracking events
  return success({ success: true });
}

export function handleGetTokenOverview(_mint: string) {
  return success({
    mint: _mint,
    name: 'OYRADE',
    symbol: 'OYR',
    price: 0.45,
    priceChange24h: 3.2,
    marketCap: 45_000_000,
    volume24h: 2_300_000,
    circulatingSupply: 100_000_000,
    totalSupply: 1_000_000_000,
    holders: 12_450,
    logoUrl: 'https://picsum.photos/64/64',
  });
}

export function handleGetGlobalStats() {
  return success({
    totalMarketCap: 2_400_000_000_000,
    totalVolume24h: 85_000_000_000,
    btcDominance: 52.3,
    ethDominance: 16.8,
    activeCryptocurrencies: 12_500,
    markets: 950,
    marketCapChange24h: 1.2,
    volumeChange24h: -3.5,
  });
}

export function handleGetOhlcv(_mint: string) {
  const now = Date.now();
  const points = 100;
  const ohlcv = Array.from({ length: points }, (_, i) => {
    const time = now - (points - 1 - i) * 3600_000; // hourly candles
    const open = 0.4 + Math.random() * 0.15;
    const close = open + (Math.random() - 0.5) * 0.04;
    const high = Math.max(open, close) + Math.random() * 0.02;
    const low = Math.min(open, close) - Math.random() * 0.02;
    const volume = Math.floor(Math.random() * 500_000 + 50_000);
    return {
      time: Math.floor(time / 1000),
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6)),
      volume,
    };
  });
  return success(ohlcv);
}

export function handleGetBinanceTokens() {
  const tokens = [
    { symbol: 'BTCUSDT', price: '65432.10', priceChange24h: '2.34', volume24h: '1234567890' },
    { symbol: 'ETHUSDT', price: '3456.78', priceChange24h: '-1.12', volume24h: '987654321' },
    { symbol: 'SOLUSDT', price: '145.67', priceChange24h: '5.67', volume24h: '456789012' },
    { symbol: 'BNBUSDT', price: '567.89', priceChange24h: '0.45', volume24h: '234567890' },
    { symbol: 'XRPUSDT', price: '0.5432', priceChange24h: '-2.34', volume24h: '345678901' },
  ];
  return success(tokens);
}

export function handleGetHolders(_mint: string) {
  return success({
    totalHolders: 12_450,
    topHolders: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      address: `Mock${i + 1}...${String.fromCharCode(65 + i)}xxx`,
      balance: Math.floor(Math.random() * 10_000_000 + 100_000),
      percentage: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
    })),
  });
}
