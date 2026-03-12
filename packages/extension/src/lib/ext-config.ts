import { setLanguageProvider } from '@hchat/shared'
import type { Language } from '@hchat/shared'

export async function initExtensionConfig(): Promise<void> {
  const result = await new Promise<Record<string, string>>((resolve) => {
    chrome.storage.sync.get(['language'], (r) => resolve(r as Record<string, string>))
  })

  const savedLang = (result.language as Language) || 'ko'
  let currentLang: Language = savedLang
  setLanguageProvider(() => currentLang)

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.language) {
      currentLang = changes.language.newValue as Language
    }
  })
}
