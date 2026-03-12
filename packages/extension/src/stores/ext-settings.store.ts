import { create } from 'zustand'
import type { Language } from '@hchat/shared'
import { DEFAULT_MODEL_ID } from '@hchat/shared'

interface Credentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

interface ExtSettingsState {
  selectedModel: string
  darkMode: boolean
  language: Language
  apiBaseUrl: string
  credentials: Credentials | null
  openaiApiKey: string | null
  geminiApiKey: string | null
  systemPrompt: string
  isLoaded: boolean

  setSelectedModel: (modelId: string) => void
  setDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  setLanguage: (lang: Language) => void
  setApiBaseUrl: (url: string) => void
  setCredentials: (creds: Credentials | null) => void
  setOpenaiApiKey: (key: string | null) => void
  setGeminiApiKey: (key: string | null) => void
  setSystemPrompt: (prompt: string) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

const DEFAULT_API_BASE = 'https://sgtlim0--hchat-api-api.modal.run'

export const useExtSettingsStore = create<ExtSettingsState>((set, get) => ({
  selectedModel: DEFAULT_MODEL_ID,
  darkMode: false,
  language: 'ko',
  apiBaseUrl: DEFAULT_API_BASE,
  credentials: null,
  openaiApiKey: null,
  geminiApiKey: null,
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
  setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
  setCredentials: (creds) => set({ credentials: creds }),
  setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
  setGeminiApiKey: (key) => set({ geminiApiKey: key }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

  loadSettings: async () => {
    try {
      const result = await chrome.storage.sync.get([
        'selectedModel', 'darkMode', 'language', 'apiBaseUrl', 'systemPrompt',
      ])
      const local = await chrome.storage.local.get([
        'credentials', 'openaiApiKey', 'geminiApiKey',
      ])

      set({
        selectedModel: result.selectedModel || DEFAULT_MODEL_ID,
        darkMode: result.darkMode ?? false,
        language: result.language || 'ko',
        apiBaseUrl: result.apiBaseUrl || DEFAULT_API_BASE,
        systemPrompt: result.systemPrompt || '',
        credentials: local.credentials || null,
        openaiApiKey: local.openaiApiKey || null,
        geminiApiKey: local.geminiApiKey || null,
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
        apiBaseUrl: state.apiBaseUrl,
        systemPrompt: state.systemPrompt,
      })
      await chrome.storage.local.set({
        credentials: state.credentials,
        openaiApiKey: state.openaiApiKey,
        geminiApiKey: state.geminiApiKey,
      })
    } catch {
      // Storage error
    }
  },
}))
