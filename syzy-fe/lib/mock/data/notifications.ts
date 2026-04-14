/**
 * Mock notifications for the Syzy mock frontend.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockNotification {
  id: string;
  type:
    | 'market_resolved'
    | 'prediction_won'
    | 'welcome'
    | 'new_market'
    | 'staking_rewards';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    marketId?: string;
    marketSlug?: string;
    link?: string;
    amount?: number;
  };
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  // Unread
  {
    id: 'notif-1',
    type: 'market_resolved',
    title: 'Market Resolved: AI Bar Exam',
    message:
      'The market "Will AI pass the bar exam with 99%?" has been resolved. The outcome was YES.',
    read: false,
    createdAt: '2026-04-01T18:00:00Z',
    data: {
      marketSlug: 'ai-passes-bar-exam-99',
      link: '/markets/ai-passes-bar-exam-99',
    },
  },
  {
    id: 'notif-2',
    type: 'prediction_won',
    title: 'Your Prediction Won! Claim 2.5 SOL',
    message:
      'Your YES position on "AI passes bar exam with 99%" won. You can now claim 2.5 SOL in winnings.',
    read: false,
    createdAt: '2026-04-01T18:05:00Z',
    data: {
      marketSlug: 'ai-passes-bar-exam-99',
      link: '/markets/ai-passes-bar-exam-99',
      amount: 2.5,
    },
  },
  // Read
  {
    id: 'notif-3',
    type: 'welcome',
    title: 'Welcome to Syzy',
    message:
      'Welcome to Syzy! Start exploring prediction markets, place your first trade, and earn staking rewards.',
    read: true,
    createdAt: '2026-01-15T00:00:00Z',
    data: {
      link: '/dashboard',
    },
  },
  {
    id: 'notif-4',
    type: 'new_market',
    title: 'New Market: TRUMP Token',
    message:
      'A new market "TRUMP token above $50 by July?" is now live. Trade your prediction!',
    read: true,
    createdAt: '2026-02-05T12:00:00Z',
    data: {
      marketSlug: 'trump-token-50-july',
      link: '/markets/trump-token-50-july',
    },
  },
  {
    id: 'notif-5',
    type: 'staking_rewards',
    title: 'Staking Rewards Available',
    message:
      'You have 2.5 SOL in unclaimed staking rewards. Visit the staking page to claim them.',
    read: true,
    createdAt: '2026-03-20T10:00:00Z',
    data: {
      link: '/staking',
      amount: 2.5,
    },
  },
];
