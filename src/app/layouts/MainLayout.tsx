import { useEffect, useState, Suspense } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { Sidebar } from '@/widgets/sidebar/Sidebar'
import { HeaderTabs } from '@/widgets/header-tabs/HeaderTabs'
import { HomeScreen } from '@/pages/home/HomeScreen'
import { SearchModal } from '@/widgets/search/SearchModal'
import { ToastContainer } from '@/shared/ui/ToastContainer'
import { useToastStore } from '@/entities/toast/toast.store'
import { useTranslation } from '@/shared/i18n'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useHydrateOnView } from '@/shared/hooks/useHydrateOnView'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { InstallBanner } from '@/shared/ui/InstallBanner'
import { SyncStatusBadge } from '@/shared/ui/SyncStatusBadge'
import { KeyboardShortcutsHelp } from '@/shared/ui/KeyboardShortcutsHelp'
import { useCopilotStore } from '@/entities/copilot/copilot.store'
import { CopilotPanel } from '@/widgets/copilot/CopilotPanel'
import { ROUTE_MAP, SettingsScreen, ChatPage } from './route-map'

export function MainLayout() {
  const { t } = useTranslation()
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar)
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  const view = useSessionStore((s) => s.view)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const searchOpen = useSessionStore((s) => s.searchOpen)
  const setSearchOpen = useSessionStore((s) => s.setSearchOpen)
  const hydrated = useSessionStore((s) => s.hydrated)
  const isOnline = useOnlineStatus()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Lazy hydration based on view
  useHydrateOnView(view)

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(!settingsOpen)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        useCopilotStore.getState().toggle()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, settingsOpen, setSearchOpen, toggleSidebar, setSettingsOpen])

  // Show loading state while hydrating
  if (!hydrated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-secondary text-sm">{t('common.loading')}</div>
      </div>
    )
  }

  // View dispatch via routing table
  function renderContent() {
    if (settingsOpen) {
      return <SettingsScreen />
    }

    const RouteComponent = ROUTE_MAP[view]
    if (RouteComponent) {
      return <RouteComponent />
    }

    if (currentSessionId && view === 'chat') {
      return <ChatPage />
    }

    return <HomeScreen />
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!isOnline && (
          <div className="bg-amber-500 text-white text-center text-sm py-1.5 px-4 flex-shrink-0">
            {t('offline.banner')}
          </div>
        )}
        <InstallBanner />
        <div className="flex items-center justify-between">
          <HeaderTabs />
          <SyncStatusBadge />
        </div>
        <main id="main-content" className="flex-1 overflow-hidden">
          <ErrorBoundary sessionContext={{ view, sessionId: currentSessionId || undefined }}>
            <Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center h-full gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-text-secondary text-sm">{t('common.loading')}</div>
              </div>
            }>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      {searchOpen && <SearchModal />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <CopilotPanel />
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  )
}
