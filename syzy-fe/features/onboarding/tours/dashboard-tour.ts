import type { DriveStep } from 'driver.js'

export const TOUR_ID = 'dashboard'
export const TOUR_VERSION = 1

export const steps: DriveStep[] = [
  {
    element: '[data-tour="market-filters"]',
    popover: {
      title: 'Filter Markets',
      description: 'Filter markets by category, volume, or trending status.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="market-grid"]',
    popover: {
      title: 'Prediction Markets',
      description:
        'Each card shows a market question with its current probability. Click any to trade.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="wallet-button"]',
    popover: {
      title: 'Connect Your Wallet',
      description: 'Connect your Solana wallet to start making predictions.',
      side: 'bottom',
      align: 'end',
    },
  },
]
