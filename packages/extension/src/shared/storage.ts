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

function getChromeStorage(): typeof chrome.storage.local | null {
  try {
    return typeof chrome !== 'undefined' && chrome?.storage?.local ? chrome.storage.local : null
  } catch {
    return null
  }
}

export async function getSettings(): Promise<ExtSettings> {
  const storage = getChromeStorage()
  if (!storage) return { ...DEFAULTS }
  try {
    const stored = await storage.get(Object.keys(DEFAULTS))
    return { ...DEFAULTS, ...stored } as ExtSettings
  } catch {
    return { ...DEFAULTS }
  }
}

export async function updateSettings(partial: Partial<ExtSettings>): Promise<void> {
  const storage = getChromeStorage()
  if (!storage) return
  await storage.set(partial)
}

export function onSettingsChanged(cb: (changes: Partial<ExtSettings>) => void): () => void {
  try {
    if (typeof chrome === 'undefined' || !chrome?.storage?.onChanged) return () => {}
  } catch {
    return () => {}
  }
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
