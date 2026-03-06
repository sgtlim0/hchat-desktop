import { create } from 'zustand'

type MobileTab = 'home' | 'chat' | 'tools' | 'settings'

interface MobileUxState {
  activeTab: MobileTab
  isFullscreenChat: boolean
  swipeEnabled: boolean
  bottomNavVisible: boolean

  setActiveTab: (tab: MobileTab) => void
  toggleFullscreenChat: () => void
  setFullscreenChat: (v: boolean) => void
  toggleSwipe: () => void
  setBottomNavVisible: (v: boolean) => void
  reset: () => void
}

const initialState = {
  activeTab: 'home' as MobileTab,
  isFullscreenChat: false,
  swipeEnabled: true,
  bottomNavVisible: true,
}

export const useMobileUxStore = create<MobileUxState>()((set) => ({
  ...initialState,

  setActiveTab: (activeTab) => set({ activeTab }),
  toggleFullscreenChat: () => set((s) => ({ isFullscreenChat: !s.isFullscreenChat })),
  setFullscreenChat: (isFullscreenChat) => set({ isFullscreenChat }),
  toggleSwipe: () => set((s) => ({ swipeEnabled: !s.swipeEnabled })),
  setBottomNavVisible: (bottomNavVisible) => set({ bottomNavVisible }),
  reset: () => set(initialState),
}))
