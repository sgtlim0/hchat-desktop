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

export type ViewState = 'home' | 'chat' | 'settings' | 'allChats' | 'projects' | 'projectDetail' | 'quickChat' | 'memory' | 'agentSwarm' | 'schedule' | 'groupChat' | 'promptLibrary' | 'debate' | 'aiTools' | 'imageGen' | 'agent' | 'translate' | 'docWriter' | 'ocr' | 'promptChain' | 'knowledgeBase' | 'workflow' | 'collab' | 'contextManager' | 'insights' | 'plugins' | 'themeBuilder' | 'batchQueue' | 'sessionInsights' | 'cacheControl' | 'auditLog'

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
