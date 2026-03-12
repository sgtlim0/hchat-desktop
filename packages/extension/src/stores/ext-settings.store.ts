import { create } from 'zustand'
import type { Language } from '@hchat/shared'
import { DEFAULT_MODEL_ID } from '@hchat/shared'

interface ExtSettingsState {
  selectedModel: string
  darkMode: boolean
  language: Language
  accessKeyId: string
  secretAccessKey: string
  systemPrompt: string
  isLoaded: boolean

  setSelectedModel: (modelId: string) => void
  setDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  setLanguage: (lang: Language) => void
  setAccessKeyId: (key: string) => void
  setSecretAccessKey: (key: string) => void
  setSystemPrompt: (prompt: string) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useExtSettingsStore = create<ExtSettingsState>((set, get) => ({
  selectedModel: DEFAULT_MODEL_ID,
  darkMode: false,
  language: 'ko',
  accessKeyId: '',
  secretAccessKey: '',
  systemPrompt: '',
  isLoaded: false,

  setSelectedModel: (modelId) => set({ selectedModel: modelId }),

  setDarkMode: (dark) => {
    set({ darkMode: dark })
    document.documentElement.classList.toggle('dark', dark)
  },

  toggleDarkMode: () => {
    const dark = !get().darkMode
    set({ darkMode: dark })
    document.documentElement.classList.toggle('dark', dark)
  },

  setLanguage: (lang) => set({ language: lang }),
  setAccessKeyId: (key) => set({ accessKeyId: key }),
  setSecretAccessKey: (key) => set({ secretAccessKey: key }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

  loadSettings: async () => {
    try {
      const result = await chrome.storage.sync.get([
        'selectedModel', 'darkMode', 'language', 'systemPrompt',
        'accessKeyId', 'secretAccessKey',
      ])

      set({
        selectedModel: result.selectedModel || DEFAULT_MODEL_ID,
        darkMode: result.darkMode ?? false,
        language: result.language || 'ko',
        systemPrompt: result.systemPrompt || '',
        accessKeyId: result.accessKeyId || '',
        secretAccessKey: result.secretAccessKey || '',
        isLoaded: true,
      })

      document.documentElement.classList.toggle('dark', result.darkMode ?? false)
    } catch {
      set({ isLoaded: true })
    }
  },

  saveSettings: async () => {
    const state = get()
    try {
      await chrome.storage.sync.set({
        selectedModel: state.selectedModel,
        darkMode: state.darkMode,
        language: state.language,
        systemPrompt: state.systemPrompt,
        accessKeyId: state.accessKeyId,
        secretAccessKey: state.secretAccessKey,
      })
    } catch {
      // Storage error
    }
  },
}))
