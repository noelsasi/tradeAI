import { create } from 'zustand'

import type { TradeData, TradeItem } from '@/lib/types'

interface AppState {
  // Active job results (cached in memory; results screen also fetches by URL param)
  tradeData: TradeData | null
  setTradeData: (data: TradeData) => void

  // Detail drawer
  drawerItem: TradeItem | null
  openDrawer: (item: TradeItem) => void
  closeDrawer: () => void
}

export const useAppStore = create<AppState>((set) => ({
  tradeData: null,
  setTradeData: (tradeData) => set({ tradeData }),

  drawerItem: null,
  openDrawer: (item) => set({ drawerItem: item }),
  closeDrawer: () => set({ drawerItem: null }),
}))
