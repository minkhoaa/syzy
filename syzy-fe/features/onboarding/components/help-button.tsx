'use client'

import { HelpCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTour } from '@/features/onboarding/hooks/use-tour'
import {
  steps as dashboardSteps,
  TOUR_ID as DASHBOARD_TOUR_ID,
  TOUR_VERSION as DASHBOARD_TOUR_VERSION,
} from '@/features/onboarding/tours/dashboard-tour'
import {
  steps as marketDetailSteps,
  TOUR_ID as MARKET_DETAIL_TOUR_ID,
  TOUR_VERSION as MARKET_DETAIL_TOUR_VERSION,
} from '@/features/onboarding/tours/market-detail-tour'
import {
  steps as portfolioSteps,
  TOUR_ID as PORTFOLIO_TOUR_ID,
  TOUR_VERSION as PORTFOLIO_TOUR_VERSION,
} from '@/features/onboarding/tours/portfolio-tour'
import {
  steps as stakingSteps,
  TOUR_ID as STAKING_TOUR_ID,
  TOUR_VERSION as STAKING_TOUR_VERSION,
} from '@/features/onboarding/tours/staking-tour'

function getTourConfig(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard') {
    return { tourId: DASHBOARD_TOUR_ID, steps: dashboardSteps, version: DASHBOARD_TOUR_VERSION }
  }
  if (pathname.startsWith('/markets/')) {
    return {
      tourId: MARKET_DETAIL_TOUR_ID,
      steps: marketDetailSteps,
      version: MARKET_DETAIL_TOUR_VERSION,
    }
  }
  if (pathname === '/portfolio') {
    return { tourId: PORTFOLIO_TOUR_ID, steps: portfolioSteps, version: PORTFOLIO_TOUR_VERSION }
  }
  if (pathname === '/staking') {
    return { tourId: STAKING_TOUR_ID, steps: stakingSteps, version: STAKING_TOUR_VERSION }
  }
  return null
}

export function HelpButton() {
  const pathname = usePathname()
  const config = getTourConfig(pathname)

  const { startTour } = useTour({
    tourId: config?.tourId ?? '',
    steps: config?.steps ?? [],
    version: config?.version ?? 1,
    autoStart: false,
  })

  if (!config) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={startTour}>
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">How it works</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>How it works</TooltipContent>
    </Tooltip>
  )
}
