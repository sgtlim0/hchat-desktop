import { create } from 'zustand'
import { DEFAULT_MODEL_ID, DEFAULT_AWS_REGION } from '@/shared/constants'
import type { AwsCredentials } from '@/shared/types'

const SETTINGS_KEY = 'hchat:settings'
const CREDENTIALS_KEY = 'hchat:credentials'

interface PersistedSettings {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  region: string
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

const persisted = loadSettings()
const savedCredentials = loadCredentials()

interface SettingsState {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  settingsOpen: boolean
  settingsTab: string
  credentials: AwsCredentials | null

  setSelectedModel: (modelId: string) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
  setSettingsTab: (tab: string) => void
  setCredentials: (credentials: AwsCredentials | null) => void
  hasCredentials: () => boolean
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedModel: persisted.selectedModel ?? DEFAULT_MODEL_ID,
  darkMode: persisted.darkMode ?? false,
  sidebarOpen: persisted.sidebarOpen ?? true,
  settingsOpen: false,
  settingsTab: 'api-keys',
  credentials: savedCredentials,

  setSelectedModel: (modelId) => {
    set({ selectedModel: modelId })
    const s = get()
    saveSettings({ selectedModel: modelId, darkMode: s.darkMode, sidebarOpen: s.sidebarOpen, region: s.credentials?.region ?? DEFAULT_AWS_REGION })
  },

  toggleDarkMode: () => {
    set((state) => ({ darkMode: !state.darkMode }))
    const s = get()
    saveSettings({ selectedModel: s.selectedModel, darkMode: s.darkMode, sidebarOpen: s.sidebarOpen, region: s.credentials?.region ?? DEFAULT_AWS_REGION })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    const s = get()
    saveSettings({ selectedModel: s.selectedModel, darkMode: s.darkMode, sidebarOpen: s.sidebarOpen, region: s.credentials?.region ?? DEFAULT_AWS_REGION })
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  setCredentials: (credentials) => {
    set({ credentials })
    saveCredentials(credentials)
  },

  hasCredentials: () => {
    const { credentials } = get()
    return Boolean(credentials?.accessKeyId && credentials?.secretAccessKey && credentials?.region)
  },
}))
