import { create } from 'zustand'
import { DEFAULT_MODEL_ID } from '@/shared/constants'

interface SettingsState {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  settingsOpen: boolean
  settingsTab: string

  setSelectedModel: (modelId: string) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
  setSettingsTab: (tab: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  selectedModel: DEFAULT_MODEL_ID,
  darkMode: false,
  sidebarOpen: true,
  settingsOpen: false,
  settingsTab: 'api-keys',

  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
}))
