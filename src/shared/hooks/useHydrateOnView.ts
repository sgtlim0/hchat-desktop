import { useEffect, useRef } from 'react'
import type { ViewState } from '@/shared/types'

// Import all stores with hydrate methods
import { useSessionStore } from '@/entities/session/session.store'
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

// Additional stores with hydrate methods not currently in MainLayout
import { useCodeInterpreterStore } from '@/entities/code-interpreter/code-interpreter.store'
import { useTranslationMemoryStore } from '@/entities/translation-memory/translation-memory.store'
import { useBookmarkStore } from '@/entities/bookmark/bookmark.store'
import { useLearningPathStore } from '@/entities/learning-path/learning-path.store'
import { useReportGeneratorStore } from '@/entities/report-generator/report-generator.store'
import { useMeetingNotesStore } from '@/entities/meeting-notes/meeting-notes.store'
import { useCodeReviewStore } from '@/entities/code-review/code-review.store'
import { useVisualPromptStore } from '@/entities/visual-prompt/visual-prompt.store'
import { useNotificationStore } from '@/entities/notification/notification.store'
import { useDataPipelineStore } from '@/entities/data-pipeline/data-pipeline.store'
import { useMentoringStore } from '@/entities/mentoring/mentoring.store'
import { useDataConnectorStore } from '@/entities/data-connector/data-connector.store'
import { useAutonomousAgentStore } from '@/entities/autonomous-agent/autonomous-agent.store'
import { useMcpStore } from '@/entities/mcp/mcp.store'
import { useAutoWorkflowStore } from '@/entities/auto-workflow/auto-workflow.store'
import { useCanvasStore } from '@/entities/canvas/canvas.store'
import { useKnowledgeGraphStore } from '@/entities/knowledge-graph/knowledge-graph.store'
import { useDataConverterStore } from '@/entities/data-converter/data-converter.store'

// Type for hydrate functions
type HydrateFn = () => Promise<void> | void

// Helper to safely get hydrate function from store
function getHydrateFn(store: any): HydrateFn | null {
  try {
    const state = store.getState?.() ?? {}
    return state.hydrate ?? null
  } catch {
    return null
  }
}

// Core stores that must always be hydrated on mount
const CORE_STORES: (() => HydrateFn | null)[] = [
  () => getHydrateFn(useSessionStore),
  // Settings store doesn't have a hydrate method - it uses localStorage directly
  () => getHydrateFn(useFolderStore),
  () => getHydrateFn(useTagStore),
]

// Map each view to the stores it needs
const VIEW_STORE_MAP: Record<ViewState, (() => HydrateFn | null)[]> = {
  // Core views
  home: [],  // Core stores only
  chat: [
    () => getHydrateFn(useUsageStore),
    () => getHydrateFn(usePersonaStore),
  ],
  settings: [],  // Core stores only
  allChats: [],  // Core stores only

  // Project management
  projects: [
    () => getHydrateFn(useProjectStore),
  ],
  projectDetail: [
    () => getHydrateFn(useProjectStore),
  ],

  // Communication & collaboration
  quickChat: [],  // Core stores only
  groupChat: [],  // Core stores only (group-chat store has no hydrate)
  collab: [
    () => getHydrateFn(useCollabStore),
  ],

  // AI & automation
  memory: [
    () => getHydrateFn(useMemoryStore),
  ],
  agentSwarm: [
    () => getHydrateFn(useSwarmStore),
  ],
  schedule: [
    () => getHydrateFn(useScheduleStore),
    () => getHydrateFn(useChannelStore),  // Channels are often used with schedules
  ],
  promptLibrary: [
    () => getHydrateFn(usePromptLibraryStore),
  ],
  debate: [],  // debate store has no hydrate
  aiTools: [],  // No specific store
  imageGen: [],  // No specific store
  agent: [],  // No specific store

  // Document tools
  translate: [],  // translate store has no hydrate
  docWriter: [],  // doc-writer store has no hydrate
  ocr: [],  // No specific store

  // Knowledge & workflow
  knowledgeBase: [
    () => getHydrateFn(useKnowledgeStore),
  ],
  workflow: [
    () => getHydrateFn(useWorkflowStore),
  ],
  promptChain: [],  // prompt-chain store has no hydrate

  // Insights & analytics
  contextManager: [
    () => getHydrateFn(useContextManagerStore),
  ],
  insights: [
    () => getHydrateFn(useInsightsStore),
  ],
  sessionInsights: [
    () => getHydrateFn(useInsightsStore),
  ],

  // System management
  plugins: [
    () => getHydrateFn(usePluginStore),
  ],
  themeBuilder: [
    () => getHydrateFn(useThemeStore),
  ],
  batchQueue: [
    () => getHydrateFn(useBatchStore),
  ],
  cacheControl: [
    () => getHydrateFn(useCacheStore),
  ],
  auditLog: [
    () => getHydrateFn(useAuditStore),
  ],

  // Dashboard & workspace
  dashboard: [
    () => getHydrateFn(useDashboardStore),
  ],
  workspace: [
    () => getHydrateFn(useWorkspaceStore),
  ],

  // Extended tools
  snippets: [],  // snippet store has no hydrate
  apiTester: [],  // api-tester store has no hydrate
  regexBuilder: [],  // regex-builder store has no hydrate
  dataConverter: [
    () => getHydrateFn(useDataConverterStore),
  ],
  diagramEditor: [],  // diagram-editor store has no hydrate
  simulation: [],  // No specific store
  digitalTwin: [],  // No specific store
  gameScenario: [],  // game-scenario store has no hydrate
  orchestra: [],  // orchestra store has no hydrate
  videoMeeting: [],  // video-meeting store has no hydrate
  apiMarketplace: [],  // api-marketplace store has no hydrate
  wiki: [],  // wiki store has no hydrate
  codePlayground: [],  // playground store has no hydrate
  okr: [],  // okr store has no hydrate
  crm: [],  // crm store has no hydrate
  journal: [],  // journal store has no hydrate
  socialMedia: [],  // social-media store has no hydrate
  projectTimeline: [],  // project-timeline store has no hydrate
  travelPlanner: [],  // travel store has no hydrate
  recipe: [],  // recipe store has no hydrate
  interviewCoach: [],  // interview store has no hydrate
  finance: [],  // finance store has no hydrate
  readingNote: [],  // reading store has no hydrate
  whiteboard: [],  // whiteboard store has no hydrate
  contract: [],  // contract store has no hydrate
  tutorialBuilder: [],  // tutorial store has no hydrate
  habitTracker: [],  // habit store has no hydrate
  liveTranslate: [],  // live-translate store has no hydrate
  docAnalyzer: [],  // doc-analyzer store has no hydrate
  gamifiedLearning: [],  // gamified-learning store has no hydrate
  dataStory: [],  // data-story store has no hydrate
  wellbeing: [],  // wellbeing store has no hydrate
  pairProgramming: [],  // pair-programming store has no hydrate
  dashboardBuilder: [],  // dashboard-builder store has no hydrate
  docCompare: [],  // doc-compare store has no hydrate
  multiAgentDebate: [],  // multi-agent-debate store has no hydrate
  portfolio: [],  // portfolio store has no hydrate
  meetingNotes: [
    () => getHydrateFn(useMeetingNotesStore),
  ],
  reportGenerator: [
    () => getHydrateFn(useReportGeneratorStore),
  ],
  learningPath: [
    () => getHydrateFn(useLearningPathStore),
  ],
  bookmarks: [
    () => getHydrateFn(useBookmarkStore),
  ],
  translationMemory: [
    () => getHydrateFn(useTranslationMemoryStore),
  ],
  presentation: [],  // presentation store has no hydrate
  summaryFeed: [],  // summary-feed store has no hydrate
  emailAssistant: [],  // email-assistant store has no hydrate
  conversationTimeline: [],  // conversation-timeline store has no hydrate
  mindMap: [],  // mindmap store has no hydrate
  mentoring: [
    () => getHydrateFn(useMentoringStore),
  ],
  dataPipeline: [
    () => getHydrateFn(useDataPipelineStore),
  ],
  codeReview: [
    () => getHydrateFn(useCodeReviewStore),
  ],
  notificationCenter: [
    () => getHydrateFn(useNotificationStore),
  ],
  visualPrompt: [
    () => getHydrateFn(useVisualPromptStore),
  ],
  mcpServers: [
    () => getHydrateFn(useMcpStore),
  ],
  autonomousAgent: [
    () => getHydrateFn(useAutonomousAgentStore),
  ],
  dataConnectors: [
    () => getHydrateFn(useDataConnectorStore),
  ],
  codeInterpreter: [
    () => getHydrateFn(useCodeInterpreterStore),
  ],
  voiceChat: [],  // voice-chat store has no hydrate
  knowledgeGraph: [
    () => getHydrateFn(useKnowledgeGraphStore),
  ],
  canvas: [
    () => getHydrateFn(useCanvasStore),
  ],
  autoWorkflow: [
    () => getHydrateFn(useAutoWorkflowStore),
  ],
  deepResearch: [],  // No specific store
  internalSearch: [],  // No specific store
  confluenceSearch: [],  // No specific store
  jiraSearch: [],  // No specific store
}

/**
 * Hook to hydrate stores lazily based on the current view.
 * Core stores (session, settings, folder, tag) are always hydrated on mount.
 * View-specific stores are hydrated only when their view is first accessed.
 */
export function useHydrateOnView(view: ViewState) {
  const hydratedViewsRef = useRef<Set<ViewState>>(new Set())
  const coreHydratedRef = useRef(false)

  // Hydrate core stores once on mount
  useEffect(() => {
    if (coreHydratedRef.current) return
    coreHydratedRef.current = true

    // Execute core store hydrations
    CORE_STORES.forEach(getHydrateFn => {
      try {
        const hydrateFn = getHydrateFn()
        if (hydrateFn) hydrateFn()
      } catch (error) {
        console.error('Failed to hydrate core store:', error)
      }
    })
  }, [])

  // Hydrate view-specific stores when view changes
  useEffect(() => {
    // Skip if this view has already been hydrated
    if (hydratedViewsRef.current.has(view)) return

    // Mark this view as hydrated
    hydratedViewsRef.current.add(view)

    // Get the hydrate functions for this view
    const viewHydrateFns = VIEW_STORE_MAP[view] ?? []

    // Execute view-specific hydrations
    viewHydrateFns.forEach(getHydrateFn => {
      try {
        const hydrateFn = getHydrateFn()
        if (hydrateFn) hydrateFn()
      } catch (error) {
        console.error(`Failed to hydrate store for view ${view}:`, error)
      }
    })
  }, [view])
}