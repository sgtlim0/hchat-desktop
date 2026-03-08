import { useEffect, Suspense } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useProjectStore } from '@/entities/project/project.store'
import { useUsageStore } from '@/entities/usage/usage.store'
import { usePromptLibraryStore } from '@/entities/prompt-library/prompt-library.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { useFolderStore } from '@/entities/folder/folder.store'
import { useTagStore } from '@/entities/tag/tag.store'
import { useMemoryStore } from '@/entities/memory/memory.store'
import { useScheduleStore } from '@/entities/schedule/schedule.store'
import { useSwarmStore } from '@/entities/swarm/swarm.store'
import { useChannelStore } from '@/entities/channel/channel.store'
import { useKnowledgeStore } from '@/entities/knowledge/knowledge.store'
import { useWorkflowStore } from '@/entities/workflow/workflow.store'
import { useCollabStore } from '@/entities/collab/collab.store'
import { useAuditStore } from '@/entities/audit/audit.store'
import { useBatchStore } from '@/entities/batch/batch.store'
import { useCacheStore } from '@/entities/cache/cache.store'
import { usePluginStore } from '@/entities/plugins/plugin.store'
import { useThemeStore } from '@/entities/theme/theme.store'
import { useContextManagerStore } from '@/entities/context-manager/context-manager.store'
import { useInsightsStore } from '@/entities/insights/insights.store'
import { useDashboardStore } from '@/entities/dashboard/dashboard.store'
import { useWorkspaceStore } from '@/entities/workspace/workspace.store'
import { Sidebar } from '@/widgets/sidebar/Sidebar'
import { HeaderTabs } from '@/widgets/header-tabs/HeaderTabs'
import { HomeScreen } from '@/pages/home/HomeScreen'
import { SearchModal } from '@/widgets/search/SearchModal'
import { ToastContainer } from '@/shared/ui/ToastContainer'
import { useTranslation } from '@/shared/i18n'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { InstallBanner } from '@/shared/ui/InstallBanner'
import { SyncStatusBadge } from '@/shared/ui/SyncStatusBadge'
import { useCopilotStore } from '@/entities/copilot/copilot.store'
import { CopilotPanel } from '@/widgets/copilot/CopilotPanel'
import { ROUTE_MAP, SettingsScreen, ChatPage } from './route-map'

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
  const hydrateFolder = useFolderStore((s) => s.hydrate)
  const hydrateTag = useTagStore((s) => s.hydrate)
  const hydrateMemory = useMemoryStore((s) => s.hydrate)
  const hydrateSchedule = useScheduleStore((s) => s.hydrate)
  const hydrateSwarm = useSwarmStore((s) => s.hydrate)
  const hydrateChannel = useChannelStore((s) => s.hydrate)
  const hydrateKnowledge = useKnowledgeStore((s) => s.hydrate)
  const hydrateWorkflow = useWorkflowStore((s) => s.hydrate)
  const hydrateCollab = useCollabStore((s) => s.hydrate)
  const hydrateAudit = useAuditStore((s) => s.hydrate)
  const hydrateBatch = useBatchStore((s) => s.hydrate)
  const hydrateCache = useCacheStore((s) => s.hydrate)
  const hydratePlugin = usePluginStore((s) => s.hydrate)
  const hydrateTheme = useThemeStore((s) => s.hydrate)
  const hydrateContextManager = useContextManagerStore((s) => s.hydrate)
  const hydrateInsights = useInsightsStore((s) => s.hydrate)
  const hydrateDashboard = useDashboardStore((s) => s.hydrate)
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrate)
  const isOnline = useOnlineStatus()

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    hydrateSession()
    hydrateProject()
    hydrateUsage()
    hydratePromptLibrary()
    hydratePersona()
    hydrateFolder()
    hydrateTag()
    hydrateMemory()
    hydrateSchedule()
    hydrateSwarm()
    hydrateChannel()
    hydrateKnowledge()
    hydrateWorkflow()
    hydrateCollab()
    hydrateAudit()
    hydrateBatch()
    hydrateCache()
    hydratePlugin()
    hydrateTheme()
    hydrateContextManager()
    hydrateInsights()
    hydrateDashboard()
    hydrateWorkspace()
  }, [hydrateSession, hydrateProject, hydrateUsage, hydratePromptLibrary, hydratePersona, hydrateFolder, hydrateTag, hydrateMemory, hydrateSchedule, hydrateSwarm, hydrateChannel, hydrateKnowledge, hydrateWorkflow, hydrateCollab, hydrateAudit, hydrateBatch, hydrateCache, hydratePlugin, hydrateTheme, hydrateContextManager, hydrateInsights, hydrateDashboard, hydrateWorkspace])

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
          <ErrorBoundary>
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
      <ToastContainer />
      <CopilotPanel />
    </>
  )
}
