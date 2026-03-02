import { useEffect } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useProjectStore } from '@/entities/project/project.store'
import { Sidebar } from '@/widgets/sidebar/Sidebar'
import { HomeScreen } from '@/pages/home/HomeScreen'
import { ChatPage } from '@/pages/chat/ChatPage'
import { SettingsScreen } from '@/pages/settings/SettingsScreen'
import { AllChatsScreen } from '@/pages/all-chats/AllChatsScreen'
import { ProjectsScreen } from '@/pages/projects/ProjectsScreen'
import { ProjectDetailScreen } from '@/pages/projects/ProjectDetailScreen'
import { QuickChatPage } from '@/pages/quick-chat/QuickChatPage'
import { MemoryPanel } from '@/pages/memory/MemoryPanel'
import { AgentSwarmBuilder } from '@/pages/swarm/AgentSwarmBuilder'
import { ScheduleManager } from '@/pages/schedule/ScheduleManager'
import { GroupChatPage } from '@/pages/group-chat/GroupChatPage'
import { SearchModal } from '@/widgets/search/SearchModal'
import { useTranslation } from '@/shared/i18n'

export function MainLayout() {
  const { t } = useTranslation()
  const sidebarOpen = useSettingsStore((s) => s.sidebarOpen)
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

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    hydrateSession()
    hydrateProject()
  }, [hydrateSession, hydrateProject])

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

    if (currentSessionId && view === 'chat') {
      return <ChatPage />
    }

    return <HomeScreen />
  }

  return (
    <>
      {sidebarOpen && <Sidebar />}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
      {searchOpen && <SearchModal />}
    </>
  )
}
