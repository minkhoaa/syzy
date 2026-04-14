import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TourCompletion {
  version: number
  completedAt: number
}

interface TourState {
  completedTours: Record<string, TourCompletion>
  activeTour: string | null
  currentStep: number
}

interface TourActions {
  completeTour: (tourId: string, version: number) => void
  shouldShowTour: (tourId: string, version: number) => boolean
  startTour: (tourId: string) => void
  resetTour: (tourId: string) => void
  resetAll: () => void
}

export const useTourStore = create<TourState & TourActions>()(
  persist(
    (set, get) => ({
      completedTours: {},
      activeTour: null,
      currentStep: 0,

      completeTour: (tourId, version) =>
        set((state) => ({
          completedTours: {
            ...state.completedTours,
            [tourId]: { version, completedAt: Date.now() },
          },
          activeTour: null,
          currentStep: 0,
        })),

      shouldShowTour: (tourId, version) => {
        const completed = get().completedTours[tourId]
        if (!completed) return true
        return completed.version < version
      },

      startTour: (tourId) => set({ activeTour: tourId, currentStep: 0 }),

      resetTour: (tourId) =>
        set((state) => {
          const { [tourId]: _, ...rest } = state.completedTours
          return { completedTours: rest }
        }),

      resetAll: () => set({ completedTours: {}, activeTour: null, currentStep: 0 }),
    }),
    {
      name: 'oyrade-tour-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: typeof window === 'undefined',
    },
  ),
)
