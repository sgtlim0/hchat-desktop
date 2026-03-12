import { setConfig, setLanguageProvider } from '@hchat/shared'
import type { Language } from '@hchat/shared'

const DEFAULT_API_BASE = 'https://sgtlim0--hchat-api-api.modal.run'

export async function initExtensionConfig(): Promise<void> {
  const result = await new Promise<Record<string, string>>((resolve) => {
    chrome.storage.sync.get(['apiBaseUrl', 'language'], (r) => resolve(r as Record<string, string>))
  })

  setConfig({
    apiBaseUrl: result.apiBaseUrl || DEFAULT_API_BASE,
    isExtension: true,
  })

  const savedLang = (result.language as Language) || 'ko'
  let currentLang: Language = savedLang
  setLanguageProvider(() => currentLang)

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.language) {
        currentLang = changes.language.newValue as Language
      }
      if (changes.apiBaseUrl) {
        setConfig({
          apiBaseUrl: changes.apiBaseUrl.newValue || DEFAULT_API_BASE,
          isExtension: true,
        })
      }
    }
  })
}
