import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import type { ViewState } from '@/shared/types'

type LazyPage = LazyExoticComponent<ComponentType>

// Special-case pages (not in ROUTE_MAP)
export const SettingsScreen: LazyPage = lazy(() => import('@/pages/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))
export const ChatPage: LazyPage = lazy(() => import('@/pages/chat/ChatPage').then((m) => ({ default: m.ChatPage })))

// Lazy-loaded page components for code splitting
const AllChatsScreen: LazyPage = lazy(() => import('@/pages/all-chats/AllChatsScreen').then((m) => ({ default: m.AllChatsScreen })))
const ProjectsScreen: LazyPage = lazy(() => import('@/pages/projects/ProjectsScreen').then((m) => ({ default: m.ProjectsScreen })))
const ProjectDetailScreen: LazyPage = lazy(() => import('@/pages/projects/ProjectDetailScreen').then((m) => ({ default: m.ProjectDetailScreen })))
const QuickChatPage: LazyPage = lazy(() => import('@/pages/quick-chat/QuickChatPage').then((m) => ({ default: m.QuickChatPage })))
const MemoryPanel: LazyPage = lazy(() => import('@/pages/memory/MemoryPanel').then((m) => ({ default: m.MemoryPanel })))
const AgentSwarmBuilder: LazyPage = lazy(() => import('@/pages/swarm/AgentSwarmBuilder').then((m) => ({ default: m.AgentSwarmBuilder })))
const ScheduleManager: LazyPage = lazy(() => import('@/pages/schedule/ScheduleManager').then((m) => ({ default: m.ScheduleManager })))
const GroupChatPage: LazyPage = lazy(() => import('@/pages/group-chat/GroupChatPage').then((m) => ({ default: m.GroupChatPage })))
const PromptLibraryPage: LazyPage = lazy(() => import('@/pages/prompt-library/PromptLibraryPage').then((m) => ({ default: m.PromptLibraryPage })))
const DebatePage: LazyPage = lazy(() => import('@/pages/debate/DebatePage').then((m) => ({ default: m.DebatePage })))
const AiToolsPage: LazyPage = lazy(() => import('@/pages/ai-tools/AiToolsPage').then((m) => ({ default: m.AiToolsPage })))
const ImageGenPage: LazyPage = lazy(() => import('@/pages/image-gen/ImageGenPage').then((m) => ({ default: m.ImageGenPage })))
const AgentPage: LazyPage = lazy(() => import('@/pages/agent/AgentPage').then((m) => ({ default: m.AgentPage })))
const TranslatePage: LazyPage = lazy(() => import('@/pages/translate/TranslatePage').then((m) => ({ default: m.TranslatePage })))
const DocWriterPage: LazyPage = lazy(() => import('@/pages/doc-writer/DocWriterPage').then((m) => ({ default: m.DocWriterPage })))
const OcrPage: LazyPage = lazy(() => import('@/pages/ocr/OcrPage').then((m) => ({ default: m.OcrPage })))
const KnowledgeBasePage: LazyPage = lazy(() => import('@/pages/knowledge/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })))
const PromptChainPage: LazyPage = lazy(() => import('@/pages/prompt-chain/PromptChainPage').then((m) => ({ default: m.PromptChainPage })))
const WorkflowBuilderPage: LazyPage = lazy(() => import('@/pages/workflow/WorkflowBuilderPage').then((m) => ({ default: m.WorkflowBuilderPage })))
const CollabRoomPage: LazyPage = lazy(() => import('@/pages/collab/CollabRoomPage').then((m) => ({ default: m.CollabRoomPage })))
const ContextManagerPage: LazyPage = lazy(() => import('@/pages/context-manager/ContextManagerPage').then((m) => ({ default: m.ContextManagerPage })))
const InsightsDashboardPage: LazyPage = lazy(() => import('@/pages/insights/InsightsDashboardPage').then((m) => ({ default: m.InsightsDashboardPage })))
const PluginMarketplacePage: LazyPage = lazy(() => import('@/pages/plugins/PluginMarketplacePage').then((m) => ({ default: m.PluginMarketplacePage })))
const ThemeBuilderPage: LazyPage = lazy(() => import('@/pages/theme/ThemeBuilderPage').then((m) => ({ default: m.ThemeBuilderPage })))
const BatchQueuePage: LazyPage = lazy(() => import('@/pages/batch/BatchQueuePage').then((m) => ({ default: m.BatchQueuePage })))
const SessionInsightsPage: LazyPage = lazy(() => import('@/pages/insights/SessionInsightsPage').then((m) => ({ default: m.SessionInsightsPage })))
const CacheControlPage: LazyPage = lazy(() => import('@/pages/cache/CacheControlPage').then((m) => ({ default: m.CacheControlPage })))
const AuditLogPage: LazyPage = lazy(() => import('@/pages/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage })))
const DashboardPage: LazyPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const WorkspacePage: LazyPage = lazy(() => import('@/pages/workspace/WorkspacePage').then((m) => ({ default: m.WorkspacePage })))
const SnippetPage: LazyPage = lazy(() => import('@/pages/snippet/SnippetPage').then((m) => ({ default: m.SnippetPage })))
const ApiTesterPage: LazyPage = lazy(() => import('@/pages/api-tester/ApiTesterPage').then((m) => ({ default: m.ApiTesterPage })))
const RegexBuilderPage: LazyPage = lazy(() => import('@/pages/regex-builder/RegexBuilderPage').then((m) => ({ default: m.RegexBuilderPage })))
const DataConverterPage: LazyPage = lazy(() => import('@/pages/data-converter/DataConverterPage').then((m) => ({ default: m.DataConverterPage })))
const DiagramEditorPage: LazyPage = lazy(() => import('@/pages/diagram-editor/DiagramEditorPage').then((m) => ({ default: m.DiagramEditorPage })))
const SimulationLabPage: LazyPage = lazy(() => import('@/pages/simulation/SimulationLabPage').then((m) => ({ default: m.SimulationLabPage })))
const DigitalTwinPage: LazyPage = lazy(() => import('@/pages/digital-twin/DigitalTwinPage').then((m) => ({ default: m.DigitalTwinPage })))
const GameScenarioPage: LazyPage = lazy(() => import('@/pages/game-scenario/GameScenarioPage').then((m) => ({ default: m.GameScenarioPage })))
const OrchestraPage: LazyPage = lazy(() => import('@/pages/orchestra/OrchestraPage').then((m) => ({ default: m.OrchestraPage })))
const VideoMeetingPage: LazyPage = lazy(() => import('@/pages/video-meeting/VideoMeetingPage').then((m) => ({ default: m.VideoMeetingPage })))
const ApiMarketplacePage: LazyPage = lazy(() => import('@/pages/api-marketplace/ApiMarketplacePage').then((m) => ({ default: m.ApiMarketplacePage })))
const WikiPageComponent: LazyPage = lazy(() => import('@/pages/wiki/WikiPage').then((m) => ({ default: m.WikiPage })))
const CodePlaygroundPage: LazyPage = lazy(() => import('@/pages/code-playground/CodePlaygroundPage').then((m) => ({ default: m.CodePlaygroundPage })))
const OkrPage: LazyPage = lazy(() => import('@/pages/okr/OkrPage').then((m) => ({ default: m.OkrPage })))
const CrmPage: LazyPage = lazy(() => import('@/pages/crm/CrmPage').then((m) => ({ default: m.CrmPage })))
const JournalPage: LazyPage = lazy(() => import('@/pages/journal/JournalPage').then((m) => ({ default: m.JournalPage })))
const SocialMediaPage: LazyPage = lazy(() => import('@/pages/social-media/SocialMediaPage').then((m) => ({ default: m.SocialMediaPage })))
const ProjectTimelinePage: LazyPage = lazy(() => import('@/pages/project-timeline/ProjectTimelinePage').then((m) => ({ default: m.ProjectTimelinePage })))
const TravelPlannerPage: LazyPage = lazy(() => import('@/pages/travel/TravelPlannerPage').then((m) => ({ default: m.TravelPlannerPage })))
const RecipePage: LazyPage = lazy(() => import('@/pages/recipe/RecipePage').then((m) => ({ default: m.RecipePage })))
const InterviewCoachPage: LazyPage = lazy(() => import('@/pages/interview-coach/InterviewCoachPage').then((m) => ({ default: m.InterviewCoachPage })))
const FinancePage: LazyPage = lazy(() => import('@/pages/finance/FinancePage').then((m) => ({ default: m.FinancePage })))
const ReadingNotePage: LazyPage = lazy(() => import('@/pages/reading-note/ReadingNotePage').then((m) => ({ default: m.ReadingNotePage })))
const WhiteboardPage: LazyPage = lazy(() => import('@/pages/whiteboard/WhiteboardPage').then((m) => ({ default: m.WhiteboardPage })))
const ContractPage: LazyPage = lazy(() => import('@/pages/contract/ContractPage').then((m) => ({ default: m.ContractPage })))
const TutorialBuilderPage: LazyPage = lazy(() => import('@/pages/tutorial-builder/TutorialBuilderPage').then((m) => ({ default: m.TutorialBuilderPage })))
const HabitTrackerPage: LazyPage = lazy(() => import('@/pages/habit-tracker/HabitTrackerPage').then((m) => ({ default: m.HabitTrackerPage })))
const LiveTranslatePage: LazyPage = lazy(() => import('@/pages/live-translate/LiveTranslatePage').then((m) => ({ default: m.LiveTranslatePage })))
const DocAnalyzerPage: LazyPage = lazy(() => import('@/pages/doc-analyzer/DocAnalyzerPage').then((m) => ({ default: m.DocAnalyzerPage })))
const GamifiedLearningPage: LazyPage = lazy(() => import('@/pages/gamified-learning/GamifiedLearningPage').then((m) => ({ default: m.GamifiedLearningPage })))
const DataStoryPage: LazyPage = lazy(() => import('@/pages/data-story/DataStoryPage').then((m) => ({ default: m.DataStoryPage })))
const WellbeingPage: LazyPage = lazy(() => import('@/pages/wellbeing/WellbeingPage').then((m) => ({ default: m.WellbeingPage })))
const PairProgrammingPage: LazyPage = lazy(() => import('@/pages/pair-programming/PairProgrammingPage').then((m) => ({ default: m.PairProgrammingPage })))
const DashboardBuilderPage: LazyPage = lazy(() => import('@/pages/dashboard-builder/DashboardBuilderPage').then((m) => ({ default: m.DashboardBuilderPage })))
const DocComparePage: LazyPage = lazy(() => import('@/pages/doc-compare/DocComparePage').then((m) => ({ default: m.DocComparePage })))
const MultiAgentDebatePage: LazyPage = lazy(() => import('@/pages/multi-agent-debate/MultiAgentDebatePage').then((m) => ({ default: m.MultiAgentDebatePage })))
const PortfolioPage: LazyPage = lazy(() => import('@/pages/portfolio/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const MeetingNotesPage: LazyPage = lazy(() => import('@/pages/meeting-notes/MeetingNotesPage').then((m) => ({ default: m.MeetingNotesPage })))
const ReportGeneratorPage: LazyPage = lazy(() => import('@/pages/report-generator/ReportGeneratorPage').then((m) => ({ default: m.ReportGeneratorPage })))
const LearningPathPage: LazyPage = lazy(() => import('@/pages/learning-path/LearningPathPage').then((m) => ({ default: m.LearningPathPage })))
const BookmarkPage: LazyPage = lazy(() => import('@/pages/bookmark/BookmarkPage').then((m) => ({ default: m.BookmarkPage })))
const TranslationMemoryPage: LazyPage = lazy(() => import('@/pages/translation-memory/TranslationMemoryPage').then((m) => ({ default: m.TranslationMemoryPage })))
const PresentationPage: LazyPage = lazy(() => import('@/pages/presentation/PresentationPage').then((m) => ({ default: m.PresentationPage })))
const SummaryFeedPage: LazyPage = lazy(() => import('@/pages/summary-feed/SummaryFeedPage').then((m) => ({ default: m.SummaryFeedPage })))
const EmailAssistantPage: LazyPage = lazy(() => import('@/pages/email-assistant/EmailAssistantPage').then((m) => ({ default: m.EmailAssistantPage })))
const ConversationTimelinePage: LazyPage = lazy(() => import('@/pages/conversation-timeline/ConversationTimelinePage').then((m) => ({ default: m.ConversationTimelinePage })))
const MindMapPage: LazyPage = lazy(() => import('@/pages/mindmap/MindMapPage').then((m) => ({ default: m.MindMapPage })))
const MentoringPage: LazyPage = lazy(() => import('@/pages/mentoring/MentoringPage').then((m) => ({ default: m.MentoringPage })))
const DataPipelinePage: LazyPage = lazy(() => import('@/pages/data-pipeline/DataPipelinePage').then((m) => ({ default: m.DataPipelinePage })))
const CodeReviewPage: LazyPage = lazy(() => import('@/pages/code-review/CodeReviewPage').then((m) => ({ default: m.CodeReviewPage })))
const NotificationCenterPage: LazyPage = lazy(() => import('@/pages/notification-center/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage })))
const VisualPromptBuilderPage: LazyPage = lazy(() => import('@/pages/visual-prompt/VisualPromptBuilderPage').then((m) => ({ default: m.VisualPromptBuilderPage })))
const McpServersPage: LazyPage = lazy(() => import('@/pages/mcp/McpServersPage').then((m) => ({ default: m.McpServersPage })))
const AutonomousAgentPage: LazyPage = lazy(() => import('@/pages/autonomous-agent/AutonomousAgentPage').then((m) => ({ default: m.AutonomousAgentPage })))
const DataConnectorsPage: LazyPage = lazy(() => import('@/pages/data-connector/DataConnectorsPage').then((m) => ({ default: m.DataConnectorsPage })))
const CodeInterpreterPage: LazyPage = lazy(() => import('@/pages/code-interpreter/CodeInterpreterPage').then((m) => ({ default: m.CodeInterpreterPage })))
const VoiceChatPage: LazyPage = lazy(() => import('@/pages/voice-chat/VoiceChatPage').then((m) => ({ default: m.VoiceChatPage })))
const KnowledgeGraphPage: LazyPage = lazy(() => import('@/pages/knowledge-graph/KnowledgeGraphPage').then((m) => ({ default: m.KnowledgeGraphPage })))
const CanvasPage: LazyPage = lazy(() => import('@/pages/canvas/CanvasPage').then((m) => ({ default: m.CanvasPage })))
const AutoWorkflowPage: LazyPage = lazy(() => import('@/pages/auto-workflow/AutoWorkflowPage').then((m) => ({ default: m.AutoWorkflowPage })))
const DeepResearchPage: LazyPage = lazy(() => import('@/pages/research/ResearchPage').then((m) => ({ default: m.ResearchPage })))
const InternalSearchPage: LazyPage = lazy(() => import('@/pages/internal-search/InternalSearchPage').then((m) => ({ default: m.InternalSearchPage })))
const ConfluenceSearchPage: LazyPage = lazy(() => import('@/pages/confluence-search/ConfluenceSearchPage').then((m) => ({ default: m.ConfluenceSearchPage })))
const JiraSearchPage: LazyPage = lazy(() => import('@/pages/jira-search/JiraSearchPage').then((m) => ({ default: m.JiraSearchPage })))

// ViewState → Component routing table
export const ROUTE_MAP: Partial<Record<ViewState, LazyPage>> = {
  allChats: AllChatsScreen,
  projects: ProjectsScreen,
  projectDetail: ProjectDetailScreen,
  quickChat: QuickChatPage,
  memory: MemoryPanel,
  agentSwarm: AgentSwarmBuilder,
  schedule: ScheduleManager,
  groupChat: GroupChatPage,
  promptLibrary: PromptLibraryPage,
  debate: DebatePage,
  aiTools: AiToolsPage,
  imageGen: ImageGenPage,
  agent: AgentPage,
  translate: TranslatePage,
  docWriter: DocWriterPage,
  ocr: OcrPage,
  knowledgeBase: KnowledgeBasePage,
  workflow: WorkflowBuilderPage,
  promptChain: PromptChainPage,
  collab: CollabRoomPage,
  contextManager: ContextManagerPage,
  insights: InsightsDashboardPage,
  plugins: PluginMarketplacePage,
  themeBuilder: ThemeBuilderPage,
  batchQueue: BatchQueuePage,
  sessionInsights: SessionInsightsPage,
  cacheControl: CacheControlPage,
  auditLog: AuditLogPage,
  dashboard: DashboardPage,
  workspace: WorkspacePage,
  snippets: SnippetPage,
  apiTester: ApiTesterPage,
  regexBuilder: RegexBuilderPage,
  dataConverter: DataConverterPage,
  diagramEditor: DiagramEditorPage,
  simulation: SimulationLabPage,
  digitalTwin: DigitalTwinPage,
  gameScenario: GameScenarioPage,
  orchestra: OrchestraPage,
  videoMeeting: VideoMeetingPage,
  apiMarketplace: ApiMarketplacePage,
  wiki: WikiPageComponent,
  codePlayground: CodePlaygroundPage,
  okr: OkrPage,
  crm: CrmPage,
  journal: JournalPage,
  socialMedia: SocialMediaPage,
  projectTimeline: ProjectTimelinePage,
  travelPlanner: TravelPlannerPage,
  recipe: RecipePage,
  interviewCoach: InterviewCoachPage,
  finance: FinancePage,
  readingNote: ReadingNotePage,
  whiteboard: WhiteboardPage,
  contract: ContractPage,
  tutorialBuilder: TutorialBuilderPage,
  habitTracker: HabitTrackerPage,
  liveTranslate: LiveTranslatePage,
  docAnalyzer: DocAnalyzerPage,
  gamifiedLearning: GamifiedLearningPage,
  dataStory: DataStoryPage,
  wellbeing: WellbeingPage,
  pairProgramming: PairProgrammingPage,
  dashboardBuilder: DashboardBuilderPage,
  docCompare: DocComparePage,
  multiAgentDebate: MultiAgentDebatePage,
  portfolio: PortfolioPage,
  meetingNotes: MeetingNotesPage,
  reportGenerator: ReportGeneratorPage,
  learningPath: LearningPathPage,
  bookmarks: BookmarkPage,
  translationMemory: TranslationMemoryPage,
  presentation: PresentationPage,
  summaryFeed: SummaryFeedPage,
  emailAssistant: EmailAssistantPage,
  conversationTimeline: ConversationTimelinePage,
  mindMap: MindMapPage,
  mentoring: MentoringPage,
  dataPipeline: DataPipelinePage,
  codeReview: CodeReviewPage,
  notificationCenter: NotificationCenterPage,
  visualPrompt: VisualPromptBuilderPage,
  mcpServers: McpServersPage,
  autonomousAgent: AutonomousAgentPage,
  dataConnectors: DataConnectorsPage,
  codeInterpreter: CodeInterpreterPage,
  voiceChat: VoiceChatPage,
  knowledgeGraph: KnowledgeGraphPage,
  canvas: CanvasPage,
  autoWorkflow: AutoWorkflowPage,
  deepResearch: DeepResearchPage,
  internalSearch: InternalSearchPage,
  confluenceSearch: ConfluenceSearchPage,
  jiraSearch: JiraSearchPage,
}
