import { useEffect, lazy, Suspense } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useProjectStore } from '@/entities/project/project.store'
import { useUsageStore } from '@/entities/usage/usage.store'
import { usePromptLibraryStore } from '@/entities/prompt-library/prompt-library.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { Sidebar } from '@/widgets/sidebar/Sidebar'
import { HomeScreen } from '@/pages/home/HomeScreen'
import { SearchModal } from '@/widgets/search/SearchModal'
import { ToastContainer } from '@/shared/ui/ToastContainer'
import { useTranslation } from '@/shared/i18n'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'

// Lazy-loaded pages for code splitting
const ChatPage = lazy(() => import('@/pages/chat/ChatPage').then((m) => ({ default: m.ChatPage })))
const SettingsScreen = lazy(() => import('@/pages/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))
const AllChatsScreen = lazy(() => import('@/pages/all-chats/AllChatsScreen').then((m) => ({ default: m.AllChatsScreen })))
const ProjectsScreen = lazy(() => import('@/pages/projects/ProjectsScreen').then((m) => ({ default: m.ProjectsScreen })))
const ProjectDetailScreen = lazy(() => import('@/pages/projects/ProjectDetailScreen').then((m) => ({ default: m.ProjectDetailScreen })))
const QuickChatPage = lazy(() => import('@/pages/quick-chat/QuickChatPage').then((m) => ({ default: m.QuickChatPage })))
const MemoryPanel = lazy(() => import('@/pages/memory/MemoryPanel').then((m) => ({ default: m.MemoryPanel })))
const AgentSwarmBuilder = lazy(() => import('@/pages/swarm/AgentSwarmBuilder').then((m) => ({ default: m.AgentSwarmBuilder })))
const ScheduleManager = lazy(() => import('@/pages/schedule/ScheduleManager').then((m) => ({ default: m.ScheduleManager })))
const GroupChatPage = lazy(() => import('@/pages/group-chat/GroupChatPage').then((m) => ({ default: m.GroupChatPage })))
const PromptLibraryPage = lazy(() => import('@/pages/prompt-library/PromptLibraryPage').then((m) => ({ default: m.PromptLibraryPage })))
const DebatePage = lazy(() => import('@/pages/debate/DebatePage').then((m) => ({ default: m.DebatePage })))
const AiToolsPage = lazy(() => import('@/pages/ai-tools/AiToolsPage').then((m) => ({ default: m.AiToolsPage })))

export function MainLayout() {
  const { t } = useTranslation()
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar)
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)

  const view = useSessionStore((s) => s.view)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const searchOpen = useSessionStore((s) => s.searchOpen)
  const setSearchOpen = useSessionStore((s) => s.setSearchOpen)
  const hydrated = useSessionStore((s) => s.hydrated)
  const hydrateSession = useSessionStore((s) => s.hydrate)
  const hydrateProject = useProjectStore((s) => s.hydrate)
  const hydrateUsage = useUsageStore((s) => s.hydrate)
  const hydratePromptLibrary = usePromptLibraryStore((s) => s.hydrate)
  const hydratePersona = usePersonaStore((s) => s.hydrate)
  const isOnline = useOnlineStatus()

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    hydrateSession()
    hydrateProject()
    hydrateUsage()
    hydratePromptLibrary()
    hydratePersona()
  }, [hydrateSession, hydrateProject, hydrateUsage, hydratePromptLibrary, hydratePersona])

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

  // View dispatch
  function renderContent() {
    if (settingsOpen) {
      return <SettingsScreen />
    }

    if (view === 'projects') {
      return <ProjectsScreen />
    }

    if (view === 'projectDetail') {
      return <ProjectDetailScreen />
    }

    if (view === 'allChats') {
      return <AllChatsScreen />
    }

    if (view === 'quickChat') {
      return <QuickChatPage />
    }

    if (view === 'memory') {
      return <MemoryPanel />
    }

    if (view === 'agentSwarm') {
      return <AgentSwarmBuilder />
    }

    if (view === 'schedule') {
      return <ScheduleManager />
    }

    if (view === 'groupChat') {
      return <GroupChatPage />
    }

    if (view === 'promptLibrary') {
      return <PromptLibraryPage />
    }

    if (view === 'debate') {
      return <DebatePage />
    }

    if (view === 'aiTools') {
      return <AiToolsPage />
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
        <main id="main-content" className="flex-1 overflow-hidden">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-text-secondary text-sm">{t('common.loading')}</div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      {searchOpen && <SearchModal />}
      <ToastContainer />
    </>
  )
}
