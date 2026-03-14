import { useEffect } from 'react'
import { setLanguageProvider } from '@hchat/shared'
import { useExtSettingsStore } from '@ext/stores/settings.store'

export function useExtSettings() {
  const settings = useExtSettingsStore()
  const { darkMode, language, updateSettings } = settings

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Set language provider for i18n
  useEffect(() => {
    setLanguageProvider(() => language)
  }, [language])

  return { settings, updateSettings }
}
