import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AgentSidebarState {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

export const useAgentSidebarStore = create<AgentSidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: 'oyrade-agent-sidebar',
      storage: createJSONStorage(() => localStorage),
      skipHydration: typeof window === 'undefined',
    },
  ),
)
