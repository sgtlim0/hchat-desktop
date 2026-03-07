import { useEffect, lazy, Suspense } from 'react'
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
import { useCopilotStore } from '@/entities/copilot/copilot.store'
import { CopilotPanel } from '@/widgets/copilot/CopilotPanel'

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
const ImageGenPage = lazy(() => import('@/pages/image-gen/ImageGenPage').then((m) => ({ default: m.ImageGenPage })))
const AgentPage = lazy(() => import('@/pages/agent/AgentPage').then((m) => ({ default: m.AgentPage })))
const TranslatePage = lazy(() => import('@/pages/translate/TranslatePage').then((m) => ({ default: m.TranslatePage })))
const DocWriterPage = lazy(() => import('@/pages/doc-writer/DocWriterPage').then((m) => ({ default: m.DocWriterPage })))
const OcrPage = lazy(() => import('@/pages/ocr/OcrPage').then((m) => ({ default: m.OcrPage })))
const KnowledgeBasePage = lazy(() => import('@/pages/knowledge/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })))
const PromptChainPage = lazy(() => import('@/pages/prompt-chain/PromptChainPage').then((m) => ({ default: m.PromptChainPage })))
const WorkflowBuilderPage = lazy(() => import('@/pages/workflow/WorkflowBuilderPage').then((m) => ({ default: m.WorkflowBuilderPage })))
const CollabRoomPage = lazy(() => import('@/pages/collab/CollabRoomPage').then((m) => ({ default: m.CollabRoomPage })))
const ContextManagerPage = lazy(() => import('@/pages/context-manager/ContextManagerPage').then((m) => ({ default: m.ContextManagerPage })))
const InsightsDashboardPage = lazy(() => import('@/pages/insights/InsightsDashboardPage').then((m) => ({ default: m.InsightsDashboardPage })))
const PluginMarketplacePage = lazy(() => import('@/pages/plugins/PluginMarketplacePage').then((m) => ({ default: m.PluginMarketplacePage })))
const ThemeBuilderPage = lazy(() => import('@/pages/theme/ThemeBuilderPage').then((m) => ({ default: m.ThemeBuilderPage })))
const BatchQueuePage = lazy(() => import('@/pages/batch/BatchQueuePage').then((m) => ({ default: m.BatchQueuePage })))
const SessionInsightsPage = lazy(() => import('@/pages/insights/SessionInsightsPage').then((m) => ({ default: m.SessionInsightsPage })))
const CacheControlPage = lazy(() => import('@/pages/cache/CacheControlPage').then((m) => ({ default: m.CacheControlPage })))
const AuditLogPage = lazy(() => import('@/pages/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const WorkspacePage = lazy(() => import('@/pages/workspace/WorkspacePage').then((m) => ({ default: m.WorkspacePage })))
const SnippetPage = lazy(() => import('@/pages/snippet/SnippetPage').then((m) => ({ default: m.SnippetPage })))
const ApiTesterPage = lazy(() => import('@/pages/api-tester/ApiTesterPage').then((m) => ({ default: m.ApiTesterPage })))
const RegexBuilderPage = lazy(() => import('@/pages/regex-builder/RegexBuilderPage').then((m) => ({ default: m.RegexBuilderPage })))
const DataConverterPage = lazy(() => import('@/pages/data-converter/DataConverterPage').then((m) => ({ default: m.DataConverterPage })))
const DiagramEditorPage = lazy(() => import('@/pages/diagram-editor/DiagramEditorPage').then((m) => ({ default: m.DiagramEditorPage })))
const WhiteboardPage = lazy(() => import('@/pages/whiteboard/WhiteboardPage').then((m) => ({ default: m.WhiteboardPage })))
const ContractPage = lazy(() => import('@/pages/contract/ContractPage').then((m) => ({ default: m.ContractPage })))
const SoundscapePage = lazy(() => import('@/pages/soundscape/SoundscapePage').then((m) => ({ default: m.SoundscapePage })))
const TutorialBuilderPage = lazy(() => import('@/pages/tutorial-builder/TutorialBuilderPage').then((m) => ({ default: m.TutorialBuilderPage })))
const HabitTrackerPage = lazy(() => import('@/pages/habit-tracker/HabitTrackerPage').then((m) => ({ default: m.HabitTrackerPage })))
const LiveTranslatePage = lazy(() => import('@/pages/live-translate/LiveTranslatePage').then((m) => ({ default: m.LiveTranslatePage })))
const DocAnalyzerPage = lazy(() => import('@/pages/doc-analyzer/DocAnalyzerPage').then((m) => ({ default: m.DocAnalyzerPage })))
const GamifiedLearningPage = lazy(() => import('@/pages/gamified-learning/GamifiedLearningPage').then((m) => ({ default: m.GamifiedLearningPage })))
const DataStoryPage = lazy(() => import('@/pages/data-story/DataStoryPage').then((m) => ({ default: m.DataStoryPage })))
const WellbeingPage = lazy(() => import('@/pages/wellbeing/WellbeingPage').then((m) => ({ default: m.WellbeingPage })))
const PairProgrammingPage = lazy(() => import('@/pages/pair-programming/PairProgrammingPage').then((m) => ({ default: m.PairProgrammingPage })))
const DashboardBuilderPage = lazy(() => import('@/pages/dashboard-builder/DashboardBuilderPage').then((m) => ({ default: m.DashboardBuilderPage })))
const DocComparePage = lazy(() => import('@/pages/doc-compare/DocComparePage').then((m) => ({ default: m.DocComparePage })))
const MultiAgentDebatePage = lazy(() => import('@/pages/multi-agent-debate/MultiAgentDebatePage').then((m) => ({ default: m.MultiAgentDebatePage })))
const PortfolioPage = lazy(() => import('@/pages/portfolio/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const MeetingNotesPage = lazy(() => import('@/pages/meeting-notes/MeetingNotesPage').then((m) => ({ default: m.MeetingNotesPage })))
const ReportGeneratorPage = lazy(() => import('@/pages/report-generator/ReportGeneratorPage').then((m) => ({ default: m.ReportGeneratorPage })))
const LearningPathPage = lazy(() => import('@/pages/learning-path/LearningPathPage').then((m) => ({ default: m.LearningPathPage })))
const BookmarkPage = lazy(() => import('@/pages/bookmark/BookmarkPage').then((m) => ({ default: m.BookmarkPage })))
const TranslationMemoryPage = lazy(() => import('@/pages/translation-memory/TranslationMemoryPage').then((m) => ({ default: m.TranslationMemoryPage })))
const PresentationPage = lazy(() => import('@/pages/presentation/PresentationPage').then((m) => ({ default: m.PresentationPage })))
const SummaryFeedPage = lazy(() => import('@/pages/summary-feed/SummaryFeedPage').then((m) => ({ default: m.SummaryFeedPage })))
const EmailAssistantPage = lazy(() => import('@/pages/email-assistant/EmailAssistantPage').then((m) => ({ default: m.EmailAssistantPage })))
const ConversationTimelinePage = lazy(() => import('@/pages/conversation-timeline/ConversationTimelinePage').then((m) => ({ default: m.ConversationTimelinePage })))
const MindMapPage = lazy(() => import('@/pages/mindmap/MindMapPage').then((m) => ({ default: m.MindMapPage })))
const MentoringPage = lazy(() => import('@/pages/mentoring/MentoringPage').then((m) => ({ default: m.MentoringPage })))
const DataPipelinePage = lazy(() => import('@/pages/data-pipeline/DataPipelinePage').then((m) => ({ default: m.DataPipelinePage })))
const CodeReviewPage = lazy(() => import('@/pages/code-review/CodeReviewPage').then((m) => ({ default: m.CodeReviewPage })))
const NotificationCenterPage = lazy(() => import('@/pages/notification-center/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage })))
const VisualPromptBuilderPage = lazy(() => import('@/pages/visual-prompt/VisualPromptBuilderPage').then((m) => ({ default: m.VisualPromptBuilderPage })))
const McpServersPage = lazy(() => import('@/pages/mcp/McpServersPage').then((m) => ({ default: m.McpServersPage })))
const AutonomousAgentPage = lazy(() => import('@/pages/autonomous-agent/AutonomousAgentPage').then((m) => ({ default: m.AutonomousAgentPage })))
const DataConnectorsPage = lazy(() => import('@/pages/data-connector/DataConnectorsPage').then((m) => ({ default: m.DataConnectorsPage })))
const CodeInterpreterPage = lazy(() => import('@/pages/code-interpreter/CodeInterpreterPage').then((m) => ({ default: m.CodeInterpreterPage })))
const VoiceChatPage = lazy(() => import('@/pages/voice-chat/VoiceChatPage').then((m) => ({ default: m.VoiceChatPage })))
const KnowledgeGraphPage = lazy(() => import('@/pages/knowledge-graph/KnowledgeGraphPage').then((m) => ({ default: m.KnowledgeGraphPage })))
const CanvasPage = lazy(() => import('@/pages/canvas/CanvasPage').then((m) => ({ default: m.CanvasPage })))
const AutoWorkflowPage = lazy(() => import('@/pages/auto-workflow/AutoWorkflowPage').then((m) => ({ default: m.AutoWorkflowPage })))

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

    if (view === 'imageGen') {
      return <ImageGenPage />
    }

    if (view === 'agent') {
      return <AgentPage />
    }

    if (view === 'translate') {
      return <TranslatePage />
    }

    if (view === 'docWriter') {
      return <DocWriterPage />
    }

    if (view === 'ocr') {
      return <OcrPage />
    }

    if (view === 'knowledgeBase') {
      return <KnowledgeBasePage />
    }

    if (view === 'workflow') {
      return <WorkflowBuilderPage />
    }

    if (view === 'promptChain') {
      return <PromptChainPage />
    }

    if (view === 'collab') {
      return <CollabRoomPage />
    }

    if (view === 'contextManager') {
      return <ContextManagerPage />
    }

    if (view === 'insights') {
      return <InsightsDashboardPage />
    }

    if (view === 'plugins') {
      return <PluginMarketplacePage />
    }

    if (view === 'themeBuilder') {
      return <ThemeBuilderPage />
    }

    if (view === 'batchQueue') {
      return <BatchQueuePage />
    }

    if (view === 'sessionInsights') {
      return <SessionInsightsPage />
    }

    if (view === 'cacheControl') {
      return <CacheControlPage />
    }

    if (view === 'auditLog') {
      return <AuditLogPage />
    }

    if (view === 'dashboard') {
      return <DashboardPage />
    }

    if (view === 'workspace') {
      return <WorkspacePage />
    }

    if (view === 'snippets') {
      return <SnippetPage />
    }

    if (view === 'apiTester') {
      return <ApiTesterPage />
    }

    if (view === 'regexBuilder') {
      return <RegexBuilderPage />
    }

    if (view === 'dataConverter') {
      return <DataConverterPage />
    }

    if (view === 'diagramEditor') {
      return <DiagramEditorPage />
    }

    if (view === 'whiteboard') {
      return <WhiteboardPage />
    }

    if (view === 'contract') {
      return <ContractPage />
    }

    if (view === 'soundscape') {
      return <SoundscapePage />
    }

    if (view === 'tutorialBuilder') {
      return <TutorialBuilderPage />
    }

    if (view === 'habitTracker') {
      return <HabitTrackerPage />
    }

    if (view === 'liveTranslate') {
      return <LiveTranslatePage />
    }

    if (view === 'docAnalyzer') {
      return <DocAnalyzerPage />
    }

    if (view === 'gamifiedLearning') {
      return <GamifiedLearningPage />
    }

    if (view === 'dataStory') {
      return <DataStoryPage />
    }

    if (view === 'wellbeing') {
      return <WellbeingPage />
    }

    if (view === 'pairProgramming') {
      return <PairProgrammingPage />
    }

    if (view === 'dashboardBuilder') {
      return <DashboardBuilderPage />
    }

    if (view === 'docCompare') {
      return <DocComparePage />
    }

    if (view === 'multiAgentDebate') {
      return <MultiAgentDebatePage />
    }

    if (view === 'portfolio') {
      return <PortfolioPage />
    }

    if (view === 'meetingNotes') {
      return <MeetingNotesPage />
    }

    if (view === 'reportGenerator') {
      return <ReportGeneratorPage />
    }

    if (view === 'learningPath') {
      return <LearningPathPage />
    }

    if (view === 'bookmarks') {
      return <BookmarkPage />
    }

    if (view === 'translationMemory') {
      return <TranslationMemoryPage />
    }

    if (view === 'presentation') {
      return <PresentationPage />
    }

    if (view === 'summaryFeed') {
      return <SummaryFeedPage />
    }

    if (view === 'emailAssistant') {
      return <EmailAssistantPage />
    }

    if (view === 'conversationTimeline') {
      return <ConversationTimelinePage />
    }

    if (view === 'mindMap') {
      return <MindMapPage />
    }

    if (view === 'mentoring') {
      return <MentoringPage />
    }

    if (view === 'dataPipeline') {
      return <DataPipelinePage />
    }

    if (view === 'codeReview') {
      return <CodeReviewPage />
    }

    if (view === 'notificationCenter') {
      return <NotificationCenterPage />
    }

    if (view === 'visualPrompt') {
      return <VisualPromptBuilderPage />
    }

    if (view === 'mcpServers') {
      return <McpServersPage />
    }

    if (view === 'autonomousAgent') {
      return <AutonomousAgentPage />
    }

    if (view === 'dataConnectors') {
      return <DataConnectorsPage />
    }

    if (view === 'codeInterpreter') {
      return <CodeInterpreterPage />
    }

    if (view === 'voiceChat') {
      return <VoiceChatPage />
    }

    if (view === 'knowledgeGraph') {
      return <KnowledgeGraphPage />
    }

    if (view === 'canvas') {
      return <CanvasPage />
    }

    if (view === 'autoWorkflow') {
      return <AutoWorkflowPage />
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
        <HeaderTabs />
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
