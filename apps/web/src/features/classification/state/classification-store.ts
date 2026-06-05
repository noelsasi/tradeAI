import { create } from 'zustand'

import type { TradeItem } from '@/lib/types'

interface ClassificationState {
  filter: string
  query: string
  drawerItem: TradeItem | null
  setFilter: (filter: string) => void
  setQuery: (query: string) => void
  openDrawer: (item: TradeItem) => void
  closeDrawer: () => void
}

export const useClassificationStore = create<ClassificationState>((set) => ({
  filter: 'All',
  query: '',
  drawerItem: null,
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
  openDrawer: (item) => set({ drawerItem: item }),
  closeDrawer: () => set({ drawerItem: null }),
}))
