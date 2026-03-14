export interface ExtSettings {
  readonly selectedModel: string
  readonly darkMode: boolean
  readonly language: 'ko' | 'en'
  readonly awsRegion: string
  readonly awsAccessKeyId: string
  readonly awsSecretAccessKey: string
  readonly openaiApiKey: string
  readonly geminiApiKey: string
}

const DEFAULTS: ExtSettings = {
  selectedModel: 'claude-sonnet-4.6',
  darkMode: false,
  language: 'ko',
  awsRegion: 'us-east-1',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
}

const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage?.local

export async function getSettings(): Promise<ExtSettings> {
  if (!hasChromeStorage) return { ...DEFAULTS }
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS))
  return { ...DEFAULTS, ...stored } as ExtSettings
}

export async function updateSettings(partial: Partial<ExtSettings>): Promise<void> {
  if (!hasChromeStorage) return
  await chrome.storage.local.set(partial)
}

export function onSettingsChanged(cb: (changes: Partial<ExtSettings>) => void): () => void {
  if (!hasChromeStorage) return () => {}
  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    const updated: Partial<ExtSettings> = {}
    for (const [key, change] of Object.entries(changes)) {
      if (key in DEFAULTS) {
        ;(updated as Record<string, unknown>)[key] = change.newValue
      }
    }
    if (Object.keys(updated).length > 0) cb(updated)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
