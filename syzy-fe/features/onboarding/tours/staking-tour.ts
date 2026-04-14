import type { DriveStep } from 'driver.js'

export const TOUR_ID = 'staking'
export const TOUR_VERSION = 1

export const steps: DriveStep[] = [
  {
    element: '[data-tour="protocol-stats"]',
    popover: {
      title: 'Staking Metrics',
      description: 'Live staking metrics — total staked, reward rate, and pool balance.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="action-hub"]',
    popover: {
      title: 'Stake & Earn',
      description: 'Stake XLM to earn XLM rewards. Claim anytime or Unstake to withdraw.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tier-section"]',
    popover: {
      title: 'Staking Tiers',
      description:
        'Higher staking tiers unlock bigger trading fee discounts — Bronze to Diamond.',
      side: 'top',
      align: 'center',
    },
  },
]
