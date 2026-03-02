import { create } from 'zustand'
import { DEFAULT_MODEL_ID, DEFAULT_AWS_REGION } from '@/shared/constants'
import type { AwsCredentials } from '@/shared/types'

const SETTINGS_KEY = 'hchat:settings'
const CREDENTIALS_KEY = 'hchat:credentials'
const OPENAI_KEY = 'hchat:openai-key'
const GEMINI_KEY = 'hchat:gemini-key'

interface PersistedSettings {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  region: string
  autoRouting: boolean
}

function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSettings(settings: PersistedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function loadCredentials(): AwsCredentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCredentials(credentials: AwsCredentials | null): void {
  if (credentials) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
  } else {
    localStorage.removeItem(CREDENTIALS_KEY)
  }
}

function loadOpenaiKey(): string | null {
  try {
    return localStorage.getItem(OPENAI_KEY)
  } catch {
    return null
  }
}

function saveOpenaiKey(key: string | null): void {
  if (key) {
    localStorage.setItem(OPENAI_KEY, key)
  } else {
    localStorage.removeItem(OPENAI_KEY)
  }
}

function loadGeminiKey(): string | null {
  try {
    return localStorage.getItem(GEMINI_KEY)
  } catch {
    return null
  }
}

function saveGeminiKey(key: string | null): void {
  if (key) {
    localStorage.setItem(GEMINI_KEY, key)
  } else {
    localStorage.removeItem(GEMINI_KEY)
  }
}

const persisted = loadSettings()
const savedCredentials = loadCredentials()
const savedOpenaiKey = loadOpenaiKey()
const savedGeminiKey = loadGeminiKey()

interface SettingsState {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  settingsOpen: boolean
  settingsTab: string
  credentials: AwsCredentials | null
  openaiApiKey: string | null
  geminiApiKey: string | null
  autoRouting: boolean

  setSelectedModel: (modelId: string) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
  setSettingsTab: (tab: string) => void
  setCredentials: (credentials: AwsCredentials | null) => void
  setOpenaiApiKey: (key: string | null) => void
  setGeminiApiKey: (key: string | null) => void
  setAutoRouting: (enabled: boolean) => void
  hasCredentials: () => boolean
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedModel: persisted.selectedModel ?? DEFAULT_MODEL_ID,
  darkMode: persisted.darkMode ?? false,
  sidebarOpen: persisted.sidebarOpen ?? true,
  settingsOpen: false,
  settingsTab: 'api-keys',
  credentials: savedCredentials,
  openaiApiKey: savedOpenaiKey,
  geminiApiKey: savedGeminiKey,
  autoRouting: persisted.autoRouting ?? false,

  setSelectedModel: (modelId) => {
    set({ selectedModel: modelId })
    const s = get()
    saveSettings({
      selectedModel: modelId,
      darkMode: s.darkMode,
      sidebarOpen: s.sidebarOpen,
      region: s.credentials?.region ?? DEFAULT_AWS_REGION,
      autoRouting: s.autoRouting,
    })
  },

  toggleDarkMode: () => {
    set((state) => ({ darkMode: !state.darkMode }))
    const s = get()
    saveSettings({
      selectedModel: s.selectedModel,
      darkMode: s.darkMode,
      sidebarOpen: s.sidebarOpen,
      region: s.credentials?.region ?? DEFAULT_AWS_REGION,
      autoRouting: s.autoRouting,
    })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    const s = get()
    saveSettings({
      selectedModel: s.selectedModel,
      darkMode: s.darkMode,
      sidebarOpen: s.sidebarOpen,
      region: s.credentials?.region ?? DEFAULT_AWS_REGION,
      autoRouting: s.autoRouting,
    })
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  setCredentials: (credentials) => {
    set({ credentials })
    saveCredentials(credentials)
  },

  setOpenaiApiKey: (key) => {
    set({ openaiApiKey: key })
    saveOpenaiKey(key)
  },

  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key })
    saveGeminiKey(key)
  },

  setAutoRouting: (enabled) => {
    set({ autoRouting: enabled })
    const s = get()
    saveSettings({
      selectedModel: s.selectedModel,
      darkMode: s.darkMode,
      sidebarOpen: s.sidebarOpen,
      region: s.credentials?.region ?? DEFAULT_AWS_REGION,
      autoRouting: enabled,
    })
  },

  hasCredentials: () => {
    const { credentials } = get()
    return Boolean(credentials?.accessKeyId && credentials?.secretAccessKey && credentials?.region)
  },
}))
