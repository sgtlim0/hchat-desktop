import type { Credentials, HistoryEntry, Settings } from './types'

const KEYS = {
  CREDENTIALS: 'hchat_credentials',
  HISTORY: 'hchat_history',
  SETTINGS: 'hchat_settings',
} as const

export async function getCredentials(): Promise<Credentials | null> {
  const result = await chrome.storage.local.get(KEYS.CREDENTIALS)
  return result[KEYS.CREDENTIALS] ?? null
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
  await chrome.storage.local.set({ [KEYS.CREDENTIALS]: credentials })
}

export async function getHistory(): Promise<readonly HistoryEntry[]> {
  const result = await chrome.storage.local.get(KEYS.HISTORY)
  return result[KEYS.HISTORY] ?? []
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory()
  const updated = [entry, ...history].slice(0, 100)
  await chrome.storage.local.set({ [KEYS.HISTORY]: updated })
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ [KEYS.HISTORY]: [] })
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(KEYS.SETTINGS)
  return result[KEYS.SETTINGS] ?? {
    model: 'sonnet-4',
    language: 'ko',
    darkMode: false,
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEYS.SETTINGS]: settings })
}
