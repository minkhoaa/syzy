'use client'

import { useEffect, useRef, useCallback } from 'react'
import { driver, type DriveStep } from 'driver.js'
import { useTourStore } from '@/features/onboarding/store/use-tour-store'

interface UseTourOptions {
  tourId: string
  steps: DriveStep[]
  version?: number
  autoStart?: boolean
  delay?: number
}

export function useTour({
  tourId,
  steps,
  version = 1,
  autoStart = true,
  delay = 1000,
}: UseTourOptions) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const { shouldShowTour, completeTour, startTour: setActiveTour } = useTourStore()
  const activeTour = useTourStore((s) => s.activeTour)

  const isActive = activeTour === tourId

  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy()
    }

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'oyrade-tour-popover',
      steps,
      onDestroyStarted: () => {
        completeTour(tourId, version)
        driverInstance.destroy()
      },
    })

    setActiveTour(tourId)
    driverInstance.drive()
    driverRef.current = driverInstance
  }, [steps, tourId, version, completeTour, setActiveTour])

  // Auto-start on first visit
  useEffect(() => {
    if (!autoStart) return
    if (!shouldShowTour(tourId, version)) return

    const timer = setTimeout(() => {
      // Verify target elements exist before starting
      const firstStep = steps[0]
      if (firstStep?.element && document.querySelector(firstStep.element as string)) {
        startTour()
      }
    }, delay)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy()
        driverRef.current = null
      }
    }
  }, [])

  return { startTour, isActive }
}
