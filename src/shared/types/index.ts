// Provider types

export type ProviderType = 'bedrock' | 'openai' | 'gemini'
export type ModelCapability = 'chat' | 'code' | 'vision' | 'reasoning' | 'fast'

export interface ProviderModelDef {
  id: string
  provider: ProviderType
  label: string
  shortLabel: string
  capabilities: ModelCapability[]
  cost: { input: number; output: number }  // USD per 1M tokens
}

export type MessageRole = 'user' | 'assistant'

export interface ToolCall {
  id: string
  toolName: string
  args?: Record<string, unknown>
  result?: string
  status: 'running' | 'done' | 'error'
}

export interface MessageSegment {
  type: 'text' | 'tool'
  content?: string        // for text
  toolCalls?: ToolCall[]  // for tool
}

export interface ImageAttachment {
  id: string
  name: string
  url: string
  type: string
}

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  segments: MessageSegment[]
  attachments?: ImageAttachment[]
  createdAt: string  // ISO string
}

export type ThinkingDepth = 'fast' | 'balanced' | 'deep'

export interface Session {
  id: string
  title: string
  modelId: string
  projectId?: string
  folderId?: string
  isFavorite: boolean
  isStreaming: boolean
  pinned: boolean
  tags: string[]
  lastMessage?: string
  summary?: string
  parentId?: string
  forkPoint?: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  instructions: string
  memories: ProjectMemory[]
  sessionIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ProjectMemory {
  id: string
  key: string
  value: string
}

export interface ModelInfo {
  id: string
  name: string
  provider: 'anthropic' | 'openai'
  description: string
  maxTokens: number
}

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
}

// Core navigation views
export type CoreView =
  | 'home' | 'chat' | 'settings' | 'allChats'
  | 'projects' | 'projectDetail' | 'quickChat' | 'dashboard'

// AI & chat feature views
export type AiFeatureView =
  | 'agent' | 'groupChat' | 'debate' | 'aiTools' | 'imageGen'
  | 'promptLibrary' | 'promptChain' | 'memory' | 'agentSwarm'
  | 'schedule' | 'voiceChat' | 'deepResearch' | 'multiAgentDebate'
  | 'autonomousAgent' | 'pairProgramming' | 'codeReview'

// Document & content tool views
export type ToolView =
  | 'translate' | 'docWriter' | 'ocr' | 'knowledgeBase'
  | 'workflow' | 'snippets' | 'regexBuilder' | 'dataConverter'
  | 'diagramEditor' | 'codeInterpreter' | 'codePlayground'
  | 'docCompare' | 'docAnalyzer' | 'apiTester' | 'canvas'
  | 'meetingNotes' | 'reportGenerator' | 'presentation'
  | 'emailAssistant' | 'liveTranslate' | 'translationMemory'
  | 'mindMap' | 'whiteboard' | 'wiki'

// Workspace & collaboration views
export type WorkspaceView =
  | 'workspace' | 'collab' | 'contextManager' | 'insights'
  | 'sessionInsights' | 'batchQueue' | 'cacheControl' | 'auditLog'
  | 'plugins' | 'themeBuilder' | 'dashboardBuilder'
  | 'notificationCenter' | 'bookmarks' | 'conversationTimeline'

// Data & analytics views
export type DataView =
  | 'knowledgeGraph' | 'dataConnectors' | 'dataPipeline'
  | 'dataStory' | 'summaryFeed' | 'portfolio' | 'visualPrompt'
  | 'autoWorkflow' | 'mcpServers'

// Search & integration views
export type SearchView =
  | 'internalSearch' | 'confluenceSearch' | 'jiraSearch'
  | 'apiMarketplace'

// Lifestyle & experimental views
export type ExperimentalView =
  | 'gamifiedLearning' | 'wellbeing' | 'mentoring' | 'learningPath'
  | 'tutorialBuilder' | 'habitTracker' | 'travelPlanner' | 'recipe'
  | 'interviewCoach' | 'finance' | 'readingNote' | 'okr' | 'crm'
  | 'journal' | 'socialMedia' | 'projectTimeline' | 'videoMeeting'
  | 'contract' | 'gameScenario' | 'orchestra'
  | 'digitalTwin' | 'simulation'

// Combined type — backward compatible
export type ViewState =
  | CoreView | AiFeatureView | ToolView | WorkspaceView
  | DataView | SearchView | ExperimentalView

// Group Chat types

export interface GroupChatResponse {
  modelId: string
  provider: ProviderType
  content: string
  isStreaming: boolean
  responseTime?: number
  error?: string
}

export interface GroupChatMessage {
  id: string
  prompt: string
  responses: GroupChatResponse[]
  timestamp: string
}

// Export types

export type ExportFormat = 'markdown' | 'html' | 'json' | 'txt' | 'pdf'

// Memory types

export type MemoryScope = 'session' | 'project'

export interface MemoryEntry {
  id: string
  key: string
  value: string
  scope: MemoryScope
  sessionId?: string
  projectId?: string
  source: 'auto' | 'manual'
  createdAt: string
  updatedAt: string
}

// Agent Swarm types

export type AgentRole = 'planner' | 'researcher' | 'coder' | 'reviewer' | 'synthesizer'
export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export interface SwarmAgent {
  id: string
  role: AgentRole
  label: string
  status: AgentStatus
  x: number
  y: number
}

export interface SwarmConnection {
  id: string
  from: string
  to: string
}

export interface SwarmTemplate {
  id: string
  name: string
  description: string
  agents: Omit<SwarmAgent, 'id' | 'status'>[]
  connections: Omit<SwarmConnection, 'id'>[]
}

// Schedule types

export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'failed'

export interface Schedule {
  id: string
  title: string
  description: string
  cron: string
  cronDescription: string
  modelId: string
  prompt: string
  status: ScheduleStatus
  lastRunAt?: string
  nextRunAt?: string
  runCount: number
  createdAt: string
  updatedAt: string
}

// Channel types

export type ChannelType = 'slack' | 'telegram'

export interface SlackConfig {
  webhookUrl: string
  channel: string
  notifyOnComplete: boolean
  notifyOnError: boolean
  notifyOnSchedule: boolean
}

export interface TelegramConfig {
  botToken: string
  chatId: string
  connected: boolean
}

export interface ChannelConfig {
  slack: SlackConfig
  telegram: TelegramConfig
}

// AWS Bedrock types

export interface AwsCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface ChatRequest {
  credentials: AwsCredentials
  modelId: string
  messages: Array<{
    role: MessageRole
    content: string
  }>
  system?: string
}

export interface ChatStreamEvent {
  type: 'text' | 'error' | 'done' | 'usage'
  content?: string
  error?: string
  usage?: { inputTokens: number; outputTokens: number }
  inputTokens?: number
  outputTokens?: number
}

// Usage Tracking types

export type UsageCategory =
  | 'chat'
  | 'translate'
  | 'doc-write'
  | 'ocr'
  | 'image-gen'
  | 'data-analysis'

export interface UsageEntry {
  id: string
  sessionId: string
  modelId: string
  provider: ProviderType
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: string
  category?: UsageCategory
}

// Prompt Library types

export type PromptCategory = 'general' | 'coding' | 'writing' | 'analysis' | 'translation' | 'custom'

export interface SavedPrompt {
  id: string
  title: string
  content: string
  category: PromptCategory
  tags: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

// Debate types

export type DebateStatus = 'setup' | 'debating' | 'summarizing' | 'done'

export interface DebateRound {
  roundNumber: number
  responses: GroupChatResponse[]
}

export interface DebateSession {
  id: string
  topic: string
  models: string[]
  rounds: DebateRound[]
  summary: string
  status: DebateStatus
  createdAt: string
}

// PDF attachment types

export interface PdfAttachment {
  fileName: string
  pageCount: number
  text: string
}

// Spreadsheet attachment types

export interface SpreadsheetAttachment {
  fileName: string
  sheetCount: number
  totalRows: number
  summary: string
}

// Persona types

export interface Persona {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Folder types

export interface Folder {
  id: string
  name: string
  color: string  // hex color
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string  // hex color
}

// Artifact types (Canvas/Artifacts feature)

export type ArtifactType = 'code' | 'html' | 'svg' | 'mermaid'

export interface ArtifactVersion {
  id: string
  content: string
  createdAt: string
}

export interface Artifact {
  id: string
  sessionId: string
  messageId: string
  title: string
  language: string
  type: ArtifactType
  versions: ArtifactVersion[]
  currentVersionIndex: number
  createdAt: string
  updatedAt: string
}

// Prompt Chain types (Phase 6)

export type ChainStepType = 'prompt' | 'condition' | 'transform'
export type ChainStatus = 'idle' | 'running' | 'paused' | 'done' | 'error'

export interface ChainStep {
  id: string
  type: ChainStepType
  label: string
  promptId?: string         // reference to SavedPrompt
  promptContent?: string    // inline prompt
  modelId?: string
  condition?: {             // for condition type
    field: string
    operator: 'contains' | 'notContains' | 'equals' | 'length_gt' | 'length_lt'
    value: string
    trueBranch: string      // step id
    falseBranch: string     // step id
  }
  transform?: 'summarize' | 'extract_json' | 'translate' | 'custom'
  customTransform?: string
}

export interface PromptChain {
  id: string
  name: string
  description: string
  steps: ChainStep[]
  variables: Record<string, string>
  status: ChainStatus
  currentStepIndex: number
  results: Record<string, string>  // stepId → output
  createdAt: string
  updatedAt: string
}

// Knowledge Base types (Phase 6)

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  chunks: KnowledgeChunk[]
  tags: string[]
  category: string
  fileType: string
  fileSize: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface KnowledgeChunk {
  id: string
  documentId: string
  content: string
  index: number
  embedding?: number[]
}

// Workflow Builder types (Phase 6)

export type WorkflowBlockType = 'prompt' | 'translate' | 'summarize' | 'extract' | 'condition' | 'output'
export type WorkflowTrigger = 'manual' | 'schedule' | 'webhook'
export type WorkflowStatus = 'draft' | 'running' | 'paused' | 'done' | 'error'

export interface WorkflowBlock {
  id: string
  type: WorkflowBlockType
  label: string
  config: Record<string, unknown>
  x: number
  y: number
  nextBlockId?: string
  conditionTrueId?: string
  conditionFalseId?: string
}

export interface WorkflowConnection {
  id: string
  from: string
  to: string
  label?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  blocks: WorkflowBlock[]
  connections: WorkflowConnection[]
  trigger: WorkflowTrigger
  cronExpression?: string
  variables: Record<string, string>
  status: WorkflowStatus
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

// Collaboration types (Phase 6)

export type CollabRole = 'host' | 'participant'

export interface CollabParticipant {
  id: string
  name: string
  role: CollabRole
  isTyping: boolean
  lastActiveAt: string
}

export interface CollabRoom {
  id: string
  name: string
  sessionId: string
  hostId: string
  participants: CollabParticipant[]
  inviteCode: string
  isActive: boolean
  createdAt: string
}

// Context Manager types (Phase 7)

export interface PinnedMessage {
  id: string
  sessionId: string
  messageId: string
  label: string
  createdAt: string
}

export type ContextTemplate = 'coding' | 'writing' | 'analysis' | 'general'

// AI Insights types (Phase 7-8)

export interface PromptQualityScore {
  id: string
  sessionId: string
  clarity: number      // 0-100
  specificity: number  // 0-100
  overall: number      // 0-100
  suggestions: string[]
  createdAt: string
}

export interface ModelRecommendation {
  modelId: string
  reason: string
  estimatedCost: number
  confidence: number   // 0-1
}

export interface InsightReport {
  id: string
  type: 'weekly' | 'monthly'
  period: string
  totalCost: number
  totalTokens: number
  topModels: Array<{ modelId: string; usage: number; cost: number }>
  savingOpportunities: string[]
  patternSummary: string
  createdAt: string
}

// Session Insights types (Phase 8)

export interface SessionCluster {
  id: string
  label: string
  sessionIds: string[]
  commonTopics: string[]
  avgCost: number
}

export interface SessionPattern {
  id: string
  pattern: string
  frequency: number
  suggestion: string
  type: 'template' | 'memory' | 'optimization'
}

// Plugin types (Phase 7)

export type PluginStatus = 'installed' | 'available' | 'disabled'

export interface Plugin {
  id: string
  name: string
  description: string
  icon: string
  version: string
  author: string
  status: PluginStatus
  permissions: string[]
  config: Record<string, unknown>
  installedAt?: string
}

// Theme Builder types (Phase 7)

export interface CustomTheme {
  id: string
  name: string
  variables: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Batch Queue types (Phase 8)

export type BatchPriority = 'high' | 'normal' | 'low'
export type BatchJobStatus = 'queued' | 'running' | 'done' | 'error' | 'paused'

export interface BatchJob {
  id: string
  title: string
  type: 'translate' | 'summarize' | 'analyze' | 'custom'
  priority: BatchPriority
  status: BatchJobStatus
  progress: number   // 0-100
  items: BatchJobItem[]
  modelId: string
  createdAt: string
  completedAt?: string
}

export interface BatchJobItem {
  id: string
  input: string
  output?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

// Cache types (Phase 8)

export interface CacheEntry {
  id: string
  promptHash: string
  promptPreview: string
  response: string
  modelId: string
  tokensSaved: number
  costSaved: number
  hitCount: number
  createdAt: string
  expiresAt: string
}

// Audit Log types (Phase 8)

export type AuditAction = 'session_create' | 'session_delete' | 'message_send' | 'file_upload' | 'settings_change' | 'export' | 'import' | 'guardrail_trigger' | 'model_switch' | 'api_call'

export interface AuditEntry {
  id: string
  action: AuditAction
  details: string
  modelId?: string
  sessionId?: string
  cost?: number
  metadata?: Record<string, unknown>
  createdAt: string
}

// Dashboard types (Phase 9)

export type DashboardWidgetType = 'recentChats' | 'usageSummary' | 'quickAssistants' | 'knowledgeSummary' | 'schedule' | 'favorites'

export interface DashboardWidget {
  id: string
  type: DashboardWidgetType
  title: string
  x: number
  y: number
  w: number
  h: number
  visible: boolean
}

export interface DashboardLayout {
  id: string
  name: string
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
}

// Multimodal types (Phase 9)

export type MultimodalType = 'image' | 'audio' | 'camera'

export interface MultimodalAttachment {
  id: string
  type: MultimodalType
  name: string
  url: string
  mimeType: string
  size: number
  thumbnail?: string
  transcription?: string
}

// Conversation Analysis types (Phase 9)

export type SentimentType = 'positive' | 'negative' | 'neutral'

export interface ConversationAnalysis {
  sessionId: string
  sentiment: SentimentType
  autoTags: string[]
  smartTitle: string
  analyzedAt: string
}

// Workspace types (Phase 9)

export type WorkspaceRole = 'admin' | 'editor' | 'viewer'

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: WorkspaceRole
  joinedAt: string
  lastActiveAt: string
}

export interface WorkspaceActivity {
  id: string
  memberId: string
  memberName: string
  action: string
  details: string
  createdAt: string
}

export interface Workspace {
  id: string
  name: string
  description: string
  avatar: string
  members: WorkspaceMember[]
  sharedPromptIds: string[]
  sharedKnowledgeIds: string[]
  activities: WorkspaceActivity[]
  createdAt: string
  updatedAt: string
}

// Code Snippet types (Phase 14)

export interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

// API Tester types (Phase 14)

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiHeader {
  key: string
  value: string
  enabled: boolean
}

export interface ApiRequest {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: ApiHeader[]
  body: string
  collectionId?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  duration: number
  size: number
  timestamp: string
}

export interface ApiCollection {
  id: string
  name: string
  description: string
  requestIds: string[]
  createdAt: string
}

// Regex Builder types (Phase 14)

export interface RegexPattern {
  id: string
  name: string
  pattern: string
  flags: string
  description: string
  testInput: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

// Data Converter types (Phase 14)

export type DataFormat = 'json' | 'yaml'

export interface ConversionHistory {
  id: string
  sourceFormat: DataFormat
  targetFormat: DataFormat
  sourceContent: string
  targetContent: string
  createdAt: string
}

// Diagram Editor types (Phase 14)

export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'pie' | 'mindmap'

export interface Diagram {
  id: string
  title: string
  type: DiagramType
  code: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

// Phase 15 types — AI Intelligence Hub & Next-gen UX

// 15-1. Voice Chat
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface VoiceTranscript {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

// 15-2. Knowledge Graph
export interface GraphNode {
  id: string
  label: string
  type: 'session' | 'document' | 'knowledge' | 'snippet' | 'topic'
  sourceId?: string
  metadata?: Record<string, string>
  createdAt: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  weight: number
  createdAt: string
}

// 15-3. Copilot (no DB types, ephemeral state only)

// 15-4. Canvas
export type CanvasNodeType = 'text' | 'image' | 'code' | 'diagram' | 'chat' | 'link'

export interface CanvasNode {
  id: string
  canvasId: string
  type: CanvasNodeType
  x: number
  y: number
  width: number
  height: number
  content: string
  metadata?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface CanvasEdge {
  id: string
  canvasId: string
  source: string
  target: string
  label?: string
}

export interface Canvas {
  id: string
  title: string
  zoom: number
  panX: number
  panY: number
  createdAt: string
  updatedAt: string
}

// 15-5. Auto Workflow
export interface WorkflowSuggestion {
  id: string
  pattern: string
  description: string
  frequency: number
  lastDetected: string
  status: 'pending' | 'accepted' | 'dismissed'
  workflowId?: string
  estimatedSavings: { tokens: number; cost: number; timeMinutes: number }
  createdAt: string
}

// Phase 10 types — AI Native & Mobile First

// 10-1. MCP Server
export type McpServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface McpTool {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string }>
}

export interface McpServer {
  id: string
  name: string
  url: string
  status: McpServerStatus
  tools: McpTool[]
  lastConnected?: string
  createdAt: string
}

// 10-2. Autonomous Agent
export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error' | 'awaiting_approval'

export interface AgentStep {
  id: string
  type: 'think' | 'tool_call' | 'observe' | 'answer'
  content: string
  toolName?: string
  toolArgs?: Record<string, string>
  toolResult?: string
  status: AgentStepStatus
  timestamp: string
}

export interface AgentRun {
  id: string
  goal: string
  steps: AgentStep[]
  status: 'running' | 'completed' | 'failed' | 'paused'
  modelId: string
  createdAt: string
  completedAt?: string
}

// 10-4. Data Connector
export type ConnectorType = 'google_sheets' | 'notion' | 'github'
export type ConnectorStatus = 'disconnected' | 'connected' | 'error'

export interface DataConnector {
  id: string
  type: ConnectorType
  name: string
  status: ConnectorStatus
  config: Record<string, string>
  lastSynced?: string
  createdAt: string
}

// 10-5. Code Interpreter
export type CodeLanguage = 'python' | 'javascript'
export type CellStatus = 'idle' | 'running' | 'done' | 'error'

export interface CodeCell {
  id: string
  language: CodeLanguage
  code: string
  output: string
  status: CellStatus
  executedAt?: string
}

export interface Notebook {
  id: string
  title: string
  cells: CodeCell[]
  createdAt: string
  updatedAt: string
}

// Phase 11 types — AI 고도화 & 데이터 인텔리전스

// 11-1. Mentoring
export type MentoringDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface LearningGoal {
  id: string
  topic: string
  difficulty: MentoringDifficulty
  progress: number
  totalSteps: number
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  updatedAt: string
}

// 11-2. Data Pipeline
export type PipelineBlockType = 'source' | 'filter' | 'sort' | 'aggregate' | 'pivot' | 'output'
export type PipelineStatus = 'draft' | 'running' | 'completed' | 'error'

export interface PipelineBlock {
  id: string
  type: PipelineBlockType
  label: string
  config: Record<string, string>
  order: number
}

export interface DataPipeline {
  id: string
  name: string
  blocks: PipelineBlock[]
  status: PipelineStatus
  lastRun?: string
  createdAt: string
  updatedAt: string
}

// 11-3. Code Review
export type ReviewSeverity = 'critical' | 'warning' | 'info' | 'suggestion'
export type ReviewCategory = 'security' | 'performance' | 'readability' | 'best-practice'

export interface ReviewComment {
  id: string
  line: number
  severity: ReviewSeverity
  category: ReviewCategory
  message: string
  suggestion?: string
}

export interface CodeReviewSession {
  id: string
  title: string
  language: string
  code: string
  comments: ReviewComment[]
  status: 'pending' | 'reviewed' | 'resolved'
  createdAt: string
}

// 11-4. Notification
export type NotificationCategory = 'schedule' | 'workflow' | 'collab' | 'system'

export interface AppNotification {
  id: string
  category: NotificationCategory
  title: string
  message: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

// 11-5. Visual Prompt Builder
export type PromptBlockType = 'instruction' | 'context' | 'constraint' | 'output_format' | 'example'

export interface PromptBlock {
  id: string
  type: PromptBlockType
  content: string
  order: number
}

export interface VisualPrompt {
  id: string
  title: string
  blocks: PromptBlock[]
  generatedPrompt: string
  qualityScore: number
  createdAt: string
  updatedAt: string
}

// Phase 12 types

// 12-1. Meeting Notes
export type MeetingTemplate = 'standup' | 'brainstorm' | 'decision' | 'retrospective'

export interface ActionItem {
  id: string
  text: string
  assignee: string
  dueDate?: string
  done: boolean
}

export interface MeetingNote {
  id: string
  title: string
  template: MeetingTemplate
  content: string
  actionItems: ActionItem[]
  participants: string[]
  createdAt: string
  updatedAt: string
}

// 12-2. Report Generator
export type ReportTemplate = 'weekly' | 'monthly' | 'project' | 'custom'

export interface Report {
  id: string
  title: string
  template: ReportTemplate
  content: string
  version: number
  createdAt: string
  updatedAt: string
}

// 12-3. Learning Path
export interface LearningStep {
  id: string
  title: string
  description: string
  completed: boolean
  score?: number
}

export interface LearningPath {
  id: string
  title: string
  topic: string
  steps: LearningStep[]
  progress: number
  createdAt: string
  updatedAt: string
}

// 12-4. Bookmark
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink'

export interface Bookmark {
  id: string
  sessionId: string
  messageId: string
  text: string
  color: HighlightColor
  note?: string
  tags: string[]
  createdAt: string
}

// 12-5. Translation Memory
export interface TranslationPair {
  id: string
  source: string
  target: string
  sourceLang: string
  targetLang: string
  domain: string
  usageCount: number
  createdAt: string
}

export interface GlossaryTerm {
  id: string
  term: string
  translation: string
  domain: string
  note?: string
}

// Phase 13 types

// 13-1. Presentation
export interface Slide {
  id: string
  title: string
  content: string
  notes: string
  order: number
}

export interface Presentation {
  id: string
  title: string
  slides: Slide[]
  template: 'business' | 'tech' | 'education' | 'summary'
  createdAt: string
  updatedAt: string
}

// 13-2. Summary Feed
export interface FeedEntry {
  id: string
  period: 'daily' | 'weekly'
  summary: string
  insights: string[]
  sessionCount: number
  createdAt: string
}

// 13-3. Email Assistant
export type EmailTone = 'formal' | 'casual' | 'friendly' | 'professional'

export interface EmailDraft {
  id: string
  subject: string
  recipient: string
  tone: EmailTone
  body: string
  isReply: boolean
  originalThread?: string
  createdAt: string
}

// 13-4. Conversation Timeline
export interface TimelineSegment {
  id: string
  sessionId: string
  topic: string
  summary: string
  startIndex: number
  endIndex: number
  createdAt: string
}

// 13-5. Mind Map
export interface MindMapNode {
  id: string
  label: string
  parentId: string | null
  children: string[]
  level: number
}

export interface MindMap {
  id: string
  title: string
  rootId: string
  nodes: MindMapNode[]
  mermaidCode: string
  createdAt: string
  updatedAt: string
}

// Phase 16 types — AI Agency & Interactive Intelligence

// 16-1. Pair Programming
export interface PairSession {
  id: string
  title: string
  language: string
  code: string
  aiSuggestions: AiSuggestion[]
  createdAt: string
  updatedAt: string
}

export interface AiSuggestion {
  id: string
  line: number
  type: 'completion' | 'fix' | 'refactor'
  original: string
  suggestion: string
  accepted: boolean
}

// 16-2. Dashboard Builder
export type BuilderWidgetType = 'chart' | 'table' | 'kpi' | 'text' | 'image'

export interface BuilderWidget {
  id: string
  type: BuilderWidgetType
  title: string
  x: number
  y: number
  width: number
  height: number
  config: Record<string, string>
}

export interface CustomDashboard {
  id: string
  title: string
  widgets: BuilderWidget[]
  isPublic: boolean
  shareUrl?: string
  createdAt: string
  updatedAt: string
}

// 16-3. Doc Compare
export interface DocComparison {
  id: string
  title: string
  docA: string
  docB: string
  diffSummary: string
  highlights: DocHighlight[]
  createdAt: string
}

export interface DocHighlight {
  id: string
  type: 'added' | 'removed' | 'changed'
  lineStart: number
  lineEnd: number
  text: string
  aiComment?: string
}

// 16-4. Multi-Agent Debate
export type DebateRole = 'proponent' | 'opponent' | 'moderator' | 'expert'

export interface DebateAgent {
  id: string
  name: string
  role: DebateRole
  modelId: string
}

export interface DebateRound {
  id: string
  roundNumber: number
  agentId: string
  content: string
  votes: number
  timestamp: string
}

export interface MultiAgentDebateSession {
  id: string
  topic: string
  agents: DebateAgent[]
  rounds: DebateRound[]
  consensus?: string
  status: 'setup' | 'running' | 'voting' | 'completed'
  maxRounds: number
  createdAt: string
}

// 16-5. Portfolio
export type PortfolioTheme = 'minimal' | 'modern' | 'creative' | 'developer' | 'elegant'

export interface PortfolioProject {
  id: string
  title: string
  description: string
  techStack: string[]
  imageUrl?: string
  liveUrl?: string
}

export interface Portfolio {
  id: string
  name: string
  title: string
  bio: string
  theme: PortfolioTheme
  projects: PortfolioProject[]
  generatedHtml: string
  createdAt: string
  updatedAt: string
}

// Phase 17 types — AI Hyper Intelligence & Immersive

// 17-1. Live Translate
export interface LiveTranslateSession {
  id: string
  title: string
  sourceLang: string
  targetLang: string
  transcripts: TranslateUtterance[]
  isActive: boolean
  createdAt: string
}

export interface TranslateUtterance {
  id: string
  speaker: 'local' | 'remote'
  original: string
  translated: string
  confidence: number
  timestamp: string
}

// 17-2. Doc Analyzer
export type DocAnalysisType = 'receipt' | 'contract' | 'businessCard' | 'table' | 'general'

export interface AnalyzedField {
  key: string
  value: string
  confidence: number
}

export interface DocAnalysis {
  id: string
  title: string
  type: DocAnalysisType
  imageUrl: string
  extractedText: string
  fields: AnalyzedField[]
  createdAt: string
}

// 17-3. Gamified Learning
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  userAnswer?: number
}

export interface LearningChallenge {
  id: string
  title: string
  topic: string
  questions: QuizQuestion[]
  score: number
  xpEarned: number
  completedAt?: string
  createdAt: string
}

export interface LearnerProfile {
  xp: number
  level: number
  streak: number
  badges: string[]
  lastActiveDate: string
}

// 17-4. Data Story
export interface StoryChapter {
  id: string
  title: string
  narrative: string
  chartType: 'bar' | 'line' | 'pie' | 'scatter'
  data: Record<string, number>[]
  insight: string
  order: number
}

export interface DataStory {
  id: string
  title: string
  chapters: StoryChapter[]
  sourceData: string
  generatedHtml: string
  createdAt: string
  updatedAt: string
}

// 17-5. Wellbeing
export type MoodLevel = 'great' | 'good' | 'neutral' | 'low' | 'stressed'

export interface MoodEntry {
  id: string
  date: string
  mood: MoodLevel
  note: string
  sessionCount: number
  topEmotions: string[]
  createdAt: string
}

export interface WellbeingReport {
  id: string
  period: 'weekly' | 'monthly'
  stressIndex: number
  productivityScore: number
  moodTrend: MoodLevel[]
  suggestions: string[]
  createdAt: string
}

// Phase 18 types — Creative Studio & Life Intelligence

// 18-1. Whiteboard
export type WhiteboardTool = 'pen' | 'rectangle' | 'circle' | 'text' | 'sticker' | 'eraser'

export interface WhiteboardElement {
  id: string
  tool: WhiteboardTool
  x: number; y: number; width: number; height: number
  content: string
  color: string
  layer: number
}

export interface Whiteboard {
  id: string
  title: string
  elements: WhiteboardElement[]
  template: 'blank' | 'brainstorm' | 'wireframe' | 'flowchart' | 'kj'
  createdAt: string
  updatedAt: string
}

// 18-2. Contract
export type ContractTemplate = 'nda' | 'employment' | 'service' | 'lease'

export interface ContractClause {
  id: string
  title: string
  content: string
  isRisky: boolean
  riskNote?: string
  order: number
}

export interface Contract {
  id: string
  title: string
  template: ContractTemplate
  parties: { name: string; role: string }[]
  clauses: ContractClause[]
  createdAt: string
  updatedAt: string
}

// 18-3. Soundscape
export type SoundType = 'nature' | 'lofi' | 'whitenoise' | 'cafe'

export interface SoundLayer {
  id: string
  type: SoundType
  label: string
  volume: number
  isPlaying: boolean
}

export interface FocusSession {
  id: string
  duration: number
  completedAt: string
}

// 18-4. Tutorial
export interface TutorialStep {
  id: string
  title: string
  description: string
  imageUrl?: string
  annotations: string[]
  order: number
}

export interface Tutorial {
  id: string
  title: string
  steps: TutorialStep[]
  createdAt: string
  updatedAt: string
}

// 18-5. Habit
export type HabitFrequency = 'daily' | 'weekday' | 'weekly'

export interface Habit {
  id: string
  name: string
  frequency: HabitFrequency
  icon: string
  color: string
  streak: number
  bestStreak: number
  completedDates: string[]
  createdAt: string
}

// Phase 19 types

export interface TravelDay { id: string; date: string; places: string[]; transport: string; notes: string }
export interface TravelPlan { id: string; title: string; destination: string; startDate: string; endDate: string; budget: number; days: TravelDay[]; createdAt: string; updatedAt: string }

export interface Recipe { id: string; title: string; ingredients: string[]; instructions: string; calories: number; protein: number; carbs: number; isFavorite: boolean; createdAt: string }
export interface MealPlan { id: string; week: string; meals: Record<string, string[]>; shoppingList: string[]; createdAt: string }

export type InterviewType = 'technical' | 'behavioral' | 'situational'
export interface InterviewQuestion { id: string; type: InterviewType; question: string; userAnswer?: string; feedback?: string; score?: number }
export interface InterviewSession { id: string; title: string; jobTitle: string; questions: InterviewQuestion[]; overallScore: number; createdAt: string }

export type TransactionType = 'income' | 'expense'
export interface Transaction { id: string; type: TransactionType; amount: number; category: string; description: string; date: string }
export interface Budget { id: string; category: string; limit: number; spent: number; month: string }
export interface FinanceReport { id: string; month: string; totalIncome: number; totalExpense: number; savings: number; suggestions: string[]; createdAt: string }

export interface BookNote { id: string; title: string; author: string; genre: string; summary: string; quotes: string[]; rating: number; status: 'reading' | 'completed' | 'wishlist'; createdAt: string; updatedAt: string }

// Phase 20 types
export interface KeyResult { id: string; title: string; target: number; current: number; unit: string }
export interface OkrObjective { id: string; title: string; quarter: string; keyResults: KeyResult[]; progress: number; status: 'active' | 'completed' | 'paused'; createdAt: string; updatedAt: string }

export interface CrmContact { id: string; name: string; company: string; email: string; phone: string; tags: string[]; score: number; interactions: CrmInteraction[]; createdAt: string }
export interface CrmInteraction { id: string; type: 'meeting' | 'email' | 'call' | 'note'; content: string; date: string }

export interface JournalEntry { id: string; date: string; aiQuestion: string; answer: string; gratitude: string[]; mood: string; createdAt: string }

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram'
export type PostTone = 'professional' | 'casual' | 'humorous'
export interface SocialPost { id: string; platform: SocialPlatform; content: string; tone: PostTone; hashtags: string[]; scheduledAt?: string; createdAt: string }

export interface ProjectMilestone { id: string; title: string; date: string; completed: boolean }
export interface ProjectTask { id: string; title: string; startDate: string; endDate: string; progress: number; dependencies: string[]; assignee: string; milestoneId?: string }
export interface ProjectTimeline { id: string; title: string; milestones: ProjectMilestone[]; tasks: ProjectTask[]; createdAt: string; updatedAt: string }

// Phase 21 types
export interface MeetingTranscript { id: string; speaker: string; text: string; timestamp: string }
export interface VideoMeeting { id: string; title: string; transcripts: MeetingTranscript[]; summary: string; actionItems: string[]; isRecording: boolean; createdAt: string }

export interface AiModel { id: string; name: string; provider: string; category: string; speed: number; quality: number; costPer1k: number; endpoint?: string }
export interface ModelBenchmark { modelId: string; latency: number; tokensPerSec: number; score: number }

export interface WikiPage { id: string; title: string; content: string; category: string; linkedPages: string[]; version: number; tags: string[]; createdAt: string; updatedAt: string }

export interface PlaygroundTab { id: string; language: 'html' | 'css' | 'javascript'; code: string }
export interface CodePlayground { id: string; title: string; tabs: PlaygroundTab[]; previewHtml: string; shareUrl?: string; createdAt: string; updatedAt: string }

export type VoicePreset = 'anchor' | 'professor' | 'narrator' | 'dj'
export interface VoiceNarration { id: string; text: string; preset: VoicePreset; pitch: number; rate: number; createdAt: string }

// Phase 22 types
export interface SpaceObject { id: string; type: 'furniture' | 'decor' | 'wall' | 'text'; x: number; y: number; z: number; label: string; color: string }
export interface VirtualSpace { id: string; title: string; template: 'office' | 'cafe' | 'gallery' | 'classroom'; objects: SpaceObject[]; createdAt: string; updatedAt: string }

export interface StoryChoice { id: string; text: string; nextNodeId: string }
export interface StoryNode { id: string; text: string; choices: StoryChoice[]; isEnding: boolean }
export interface GameScenario { id: string; title: string; genre: string; nodes: StoryNode[]; currentNodeId: string; createdAt: string }

export type AvatarEmotion = 'joy' | 'sad' | 'angry' | 'surprise' | 'neutral'
export interface AvatarConfig { id: string; name: string; emotion: AvatarEmotion; hairStyle: string; hairColor: string; skinColor: string; outfit: string; createdAt: string }

export interface Data3DPoint { x: number; y: number; z: number; label: string; cluster?: number }
export interface Data3DScene { id: string; title: string; points: Data3DPoint[]; chartType: '3d-bar' | '3d-scatter' | '3d-pie'; createdAt: string }

export type OrchestraRole = 'researcher' | 'writer' | 'editor' | 'reviewer'
export interface OrchestraAgent { id: string; name: string; role: OrchestraRole; modelId: string; output: string; status: 'idle' | 'running' | 'done' }
export interface OrchestraSession { id: string; title: string; goal: string; agents: OrchestraAgent[]; finalOutput: string; status: 'setup' | 'running' | 'merging' | 'completed'; createdAt: string }

// Phase 23 types
export interface TwinPersonality { creativity: number; accuracy: number; humor: number }
export interface DigitalTwin { id: string; name: string; personality: TwinPersonality; learnedPatterns: string[]; autoResponses: string[]; isActive: boolean; createdAt: string }

export interface MusicChord { id: string; name: string; notes: string[]; duration: number }
export interface MusicComposition { id: string; title: string; genre: string; tempo: number; chords: MusicChord[]; createdAt: string }

export interface DreamChoice { id: string; text: string; probability: number; outcome: string }
export interface DreamScenario { id: string; title: string; premise: string; choices: DreamChoice[]; selectedChoiceId?: string; result?: string; createdAt: string }

export interface QuantumCluster { id: string; label: string; color: string; pointIndices: number[] }
export interface QuantumDataset { id: string; title: string; dimensions: number; points: number[][]; clusters: QuantumCluster[]; createdAt: string }

export type PhilosophyTopic = 'ethics' | 'epistemology' | 'metaphysics' | 'logic' | 'aesthetics'
export interface PhilosophyDialogue { id: string; topic: PhilosophyTopic; messages: { role: 'user' | 'socrates'; content: string }[]; experiment?: string; createdAt: string }

// Phase 24 types
export interface SimParam { id: string; name: string; value: number; min: number; max: number; step: number }
export interface SimResult { tick: number; values: Record<string, number> }
export interface Simulation { id: string; title: string; type: 'physics' | 'economy' | 'society'; params: SimParam[]; results: SimResult[]; isRunning: boolean; createdAt: string }

export interface SmartContractTemplate { id: string; name: string; standard: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'custom'; code: string; vulnerabilities: string[]; gasEstimate: number; createdAt: string }

export interface MovieCharacter { id: string; name: string; role: string; arc: string }
export interface MovieScene { id: string; act: 1 | 2 | 3; title: string; description: string; dialogue: string; order: number }
export interface MovieScript { id: string; title: string; genre: string; characters: MovieCharacter[]; scenes: MovieScene[]; createdAt: string; updatedAt: string }

export interface NeuroEntry { id: string; timestamp: string; focus: number; stress: number; energy: number; note: string }
export interface NeuroReport { id: string; period: string; peakHours: string[]; avgFocus: number; avgStress: number; suggestions: string[]; createdAt: string }

export interface CelestialBody { id: string; name: string; type: 'star' | 'planet' | 'moon' | 'asteroid'; description: string; distance: number; magnitude: number }
export interface SpaceQuiz { id: string; question: string; options: string[]; correctIndex: number; userAnswer?: number }
export interface SpaceExploration { id: string; title: string; bodies: CelestialBody[]; quizzes: SpaceQuiz[]; score: number; createdAt: string }
