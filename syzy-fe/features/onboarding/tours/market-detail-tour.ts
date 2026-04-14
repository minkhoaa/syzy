import type { DriveStep } from 'driver.js'

export const TOUR_ID = 'market-detail'
export const TOUR_VERSION = 1

export const steps: DriveStep[] = [
  {
    element: '[data-tour="market-hero"]',
    popover: {
      title: 'Prediction Market',
      description:
        "This is a prediction market. The probability shows the community's confidence in YES.",
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="probability-chart"]',
    popover: {
      title: 'Probability Chart',
      description: 'Track how probability changes over time as traders buy and sell.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="trade-mode"]',
    popover: {
      title: 'Buy or Sell',
      description:
        'BUY to open a position, SELL to close one. Choose YES or NO based on your prediction.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="outcome-buttons"]',
    popover: {
      title: 'Choose Your Outcome',
      description:
        'The price equals the implied probability. YES at 0.30 SOL = 30% chance of winning.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="fee-preview"]',
    popover: {
      title: 'Potential Payout',
      description: 'Your potential payout is shown here. Each winning token = 1 SOL face value.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="privacy-toggle"]',
    popover: {
      title: 'Privacy Mode',
      description:
        'Enable Privacy Mode for ZK-shielded trades — your position is hidden on-chain.',
      side: 'left',
      align: 'start',
    },
  },
]
