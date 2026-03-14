import { useEffect } from 'react'
import { setLanguageProvider, useTranslation } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { ExtNavBar } from '@ext/components/ExtNavBar'
import { ExtToastContainer } from '@ext/components/ExtToastContainer'
import { ChatPage } from '@ext/pages/ChatPage'
import { HistoryPage } from '@ext/pages/HistoryPage'
import { SettingsPage } from '@ext/pages/SettingsPage'
import { PromptLibraryPage } from '@ext/pages/PromptLibraryPage'
import { PageContextPage } from '@ext/pages/PageContextPage'
import type { ExtPage } from '@ext/shared/types'

function renderPage(page: ExtPage) {
  switch (page) {
    case 'chat':
      return <ChatPage />
    case 'history':
      return <HistoryPage />
    case 'settings':
      return <SettingsPage />
    case 'promptLibrary':
      return <PromptLibraryPage />
    case 'pageContext':
      return <PageContextPage />
    default:
      return <ChatPage />
  }
}

export default function App() {
  const currentPage = useExtSessionStore((s) => s.currentPage)
  const darkMode = useExtSettingsStore((s) => s.darkMode)
  const language = useExtSettingsStore((s) => s.language)
  const loadFromStorage = useExtSettingsStore((s) => s.loadFromStorage)
  const hydrate = useExtSessionStore((s) => s.hydrate)

  useEffect(() => {
    setLanguageProvider(() => language)
  }, [language])

  useEffect(() => {
    loadFromStorage()
    hydrate()
  }, [loadFromStorage, hydrate])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-page)]">
      <main className="flex-1 overflow-hidden">
        {renderPage(currentPage)}
      </main>
      <ExtNavBar />
      <ExtToastContainer />
    </div>
  )
}
