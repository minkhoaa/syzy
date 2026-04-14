import type { DriveStep } from 'driver.js'

export const TOUR_ID = 'portfolio'
export const TOUR_VERSION = 1

export const steps: DriveStep[] = [
  {
    element: '[data-tour="account-sidebar"]',
    popover: {
      title: 'Portfolio Overview',
      description: 'Your portfolio overview — total balance, P&L, and asset allocation.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="portfolio-tabs"]',
    popover: {
      title: 'Navigation Tabs',
      description: 'Switch between Active Positions, Trade History, and your Watchlist.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="public-shielded-toggle"]',
    popover: {
      title: 'Public vs Shielded',
      description: 'Toggle between public on-chain positions and ZK-private shielded positions.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="position-rows"]',
    popover: {
      title: 'Your Positions',
      description:
        'Each row shows your market position with current value, ROI, and payout if you win.',
      side: 'top',
      align: 'center',
    },
  },
]
