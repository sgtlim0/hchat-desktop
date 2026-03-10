import { useEffect } from 'react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { MainLayout } from '@/app/layouts/MainLayout'
import { setLanguageProvider } from '@/shared/i18n'

export function App() {
  const darkMode = useSettingsStore((s) => s.darkMode)

  // Initialize language provider for i18n
  useEffect(() => {
    setLanguageProvider(() => useSettingsStore.getState().language)
  }, [])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="h-screen bg-page text-text-primary flex overflow-hidden">
        <MainLayout />
      </div>
    </div>
  )
}
