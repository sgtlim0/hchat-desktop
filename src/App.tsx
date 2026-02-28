import { useSettingsStore } from '@/entities/settings/settings.store'
import { MainLayout } from '@/app/layouts/MainLayout'

export function App() {
  const darkMode = useSettingsStore((s) => s.darkMode)

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="h-screen bg-page text-text-primary flex overflow-hidden">
        <MainLayout />
      </div>
    </div>
  )
}
