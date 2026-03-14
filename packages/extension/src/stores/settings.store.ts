import { create } from 'zustand'
import type { ExtSettings } from '@ext/shared/storage'
import { getSettings, updateSettings as chromeUpdateSettings, onSettingsChanged } from '@ext/shared/storage'

interface ExtSettingsState extends ExtSettings {
  loadFromStorage: () => Promise<void>
  updateSettings: (partial: Partial<ExtSettings>) => void
}

export const useExtSettingsStore = create<ExtSettingsState>((set) => ({
  selectedModel: 'claude-sonnet-4.6',
  darkMode: false,
  language: 'ko',
  awsRegion: 'us-east-1',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
  openaiApiKey: '',
  geminiApiKey: '',

  loadFromStorage: async () => {
    try {
      const settings = await getSettings()
      set(settings)
    } catch (error) {
      console.error('Failed to load settings from chrome.storage:', error)
    }
  },

  updateSettings: (partial: Partial<ExtSettings>) => {
    set((state) => ({ ...state, ...partial }))
    chromeUpdateSettings(partial).catch(console.error)
  },
}))

// Listen for cross-context changes (e.g., popup changes settings, sidepanel updates)
onSettingsChanged((changes) => {
  useExtSettingsStore.setState(changes)
})
