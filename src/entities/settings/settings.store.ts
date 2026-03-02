import { create } from 'zustand'
import { DEFAULT_MODEL_ID, DEFAULT_AWS_REGION } from '@/shared/constants'
import type { AwsCredentials, ThinkingDepth } from '@/shared/types'
import type { Language } from '@/shared/i18n/types'

const SETTINGS_KEY = 'hchat:settings'
const LANGUAGE_KEY = 'hchat:language'
const CREDENTIALS_KEY = 'hchat:credentials'
const OPENAI_KEY = 'hchat:openai-key'
const GEMINI_KEY = 'hchat:gemini-key'

interface PersistedSettings {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  region: string
  autoRouting: boolean
  thinkingDepth: ThinkingDepth
  monthlyBudget: number
  budgetThreshold: number
  guardrailEnabled: boolean
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

function loadLanguage(): Language {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY)
    return raw === 'en' ? 'en' : 'ko'
  } catch {
    return 'ko'
  }
}

function saveLanguage(lang: Language): void {
  localStorage.setItem(LANGUAGE_KEY, lang)
}

function buildPersistedSettings(s: {
  selectedModel: string
  darkMode: boolean
  sidebarOpen: boolean
  credentials?: AwsCredentials | null
  autoRouting: boolean
  thinkingDepth?: ThinkingDepth
  monthlyBudget?: number
  budgetThreshold?: number
  guardrailEnabled?: boolean
}): PersistedSettings {
  return {
    selectedModel: s.selectedModel,
    darkMode: s.darkMode,
    sidebarOpen: s.sidebarOpen,
    region: s.credentials?.region ?? DEFAULT_AWS_REGION,
    autoRouting: s.autoRouting,
    thinkingDepth: s.thinkingDepth ?? 'balanced',
    monthlyBudget: s.monthlyBudget ?? 10,
    budgetThreshold: s.budgetThreshold ?? 0.7,
    guardrailEnabled: s.guardrailEnabled ?? true,
  }
}

const persisted = loadSettings()
const savedCredentials = loadCredentials()
const savedOpenaiKey = loadOpenaiKey()
const savedGeminiKey = loadGeminiKey()
const savedLanguage = loadLanguage()

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
  language: Language
  thinkingDepth: ThinkingDepth
  monthlyBudget: number
  budgetThreshold: number
  guardrailEnabled: boolean

  setSelectedModel: (modelId: string) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
  setSettingsTab: (tab: string) => void
  setCredentials: (credentials: AwsCredentials | null) => void
  setOpenaiApiKey: (key: string | null) => void
  setGeminiApiKey: (key: string | null) => void
  setAutoRouting: (enabled: boolean) => void
  setLanguage: (lang: Language) => void
  setThinkingDepth: (depth: ThinkingDepth) => void
  setMonthlyBudget: (budget: number) => void
  setBudgetThreshold: (threshold: number) => void
  setGuardrailEnabled: (enabled: boolean) => void
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
  language: savedLanguage,
  thinkingDepth: (persisted.thinkingDepth as ThinkingDepth) ?? 'balanced',
  monthlyBudget: persisted.monthlyBudget ?? 10,
  budgetThreshold: persisted.budgetThreshold ?? 0.7,
  guardrailEnabled: persisted.guardrailEnabled ?? true,

  setSelectedModel: (modelId) => {
    set({ selectedModel: modelId })
    saveSettings(buildPersistedSettings(get()))
  },

  toggleDarkMode: () => {
    set((state) => ({ darkMode: !state.darkMode }))
    saveSettings(buildPersistedSettings(get()))
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    saveSettings(buildPersistedSettings(get()))
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
    saveSettings(buildPersistedSettings(get()))
  },

  setLanguage: (lang) => {
    set({ language: lang })
    saveLanguage(lang)
  },

  setThinkingDepth: (depth) => {
    set({ thinkingDepth: depth })
    saveSettings(buildPersistedSettings(get()))
  },

  setMonthlyBudget: (budget) => {
    set({ monthlyBudget: budget })
    saveSettings(buildPersistedSettings(get()))
  },

  setBudgetThreshold: (threshold) => {
    set({ budgetThreshold: threshold })
    saveSettings(buildPersistedSettings(get()))
  },

  setGuardrailEnabled: (enabled) => {
    set({ guardrailEnabled: enabled })
    saveSettings(buildPersistedSettings(get()))
  },

  hasCredentials: () => {
    const { credentials } = get()
    return Boolean(credentials?.accessKeyId && credentials?.secretAccessKey && credentials?.region)
  },
}))
