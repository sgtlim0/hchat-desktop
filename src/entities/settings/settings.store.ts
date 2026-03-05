import { create } from 'zustand'
import { DEFAULT_MODEL_ID, DEFAULT_AWS_REGION } from '@/shared/constants'
import type { AwsCredentials, ThinkingDepth } from '@/shared/types'
import type { Language } from '@/shared/i18n/types'
import { encrypt, decryptWithMigration } from '@/shared/lib/crypto'

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

async function saveCredentials(credentials: AwsCredentials | null): Promise<void> {
  if (credentials) {
    const encrypted = await encrypt(JSON.stringify(credentials))
    localStorage.setItem(CREDENTIALS_KEY, encrypted)
  } else {
    localStorage.removeItem(CREDENTIALS_KEY)
  }
}

async function loadCredentialsAsync(): Promise<AwsCredentials | null> {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    if (!raw) return null
    const decrypted = await decryptWithMigration(raw, (encrypted) => {
      localStorage.setItem(CREDENTIALS_KEY, encrypted)
    })
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

async function saveOpenaiKey(key: string | null): Promise<void> {
  if (key) {
    const encrypted = await encrypt(key)
    localStorage.setItem(OPENAI_KEY, encrypted)
  } else {
    localStorage.removeItem(OPENAI_KEY)
  }
}

async function loadOpenaiKeyAsync(): Promise<string | null> {
  try {
    const raw = localStorage.getItem(OPENAI_KEY)
    if (!raw) return null
    return await decryptWithMigration(raw, (encrypted) => {
      localStorage.setItem(OPENAI_KEY, encrypted)
    })
  } catch {
    return null
  }
}

async function saveGeminiKey(key: string | null): Promise<void> {
  if (key) {
    const encrypted = await encrypt(key)
    localStorage.setItem(GEMINI_KEY, encrypted)
  } else {
    localStorage.removeItem(GEMINI_KEY)
  }
}

async function loadGeminiKeyAsync(): Promise<string | null> {
  try {
    const raw = localStorage.getItem(GEMINI_KEY)
    if (!raw) return null
    return await decryptWithMigration(raw, (encrypted) => {
      localStorage.setItem(GEMINI_KEY, encrypted)
    })
  } catch {
    return null
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
  hydrateSecrets: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedModel: persisted.selectedModel ?? DEFAULT_MODEL_ID,
  darkMode: persisted.darkMode ?? false,
  sidebarOpen: persisted.sidebarOpen ?? true,
  settingsOpen: false,
  settingsTab: 'api-keys',
  credentials: null,
  openaiApiKey: null,
  geminiApiKey: null,
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
    saveCredentials(credentials).catch(() => {})
  },

  setOpenaiApiKey: (key) => {
    set({ openaiApiKey: key })
    saveOpenaiKey(key).catch(() => {})
  },

  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key })
    saveGeminiKey(key).catch(() => {})
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

  hydrateSecrets: async () => {
    const [credentials, openaiApiKey, geminiApiKey] = await Promise.all([
      loadCredentialsAsync(),
      loadOpenaiKeyAsync(),
      loadGeminiKeyAsync(),
    ])
    set({ credentials, openaiApiKey, geminiApiKey })
  },
}))

// Auto-hydrate encrypted secrets on module load
useSettingsStore.getState().hydrateSecrets().catch(() => {})
