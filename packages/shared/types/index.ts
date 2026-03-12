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

// AWS Bedrock types

export interface AwsCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface ChatStreamEvent {
  type: 'text' | 'error' | 'done' | 'usage'
  content?: string
  error?: string
  usage?: { inputTokens: number; outputTokens: number }
  inputTokens?: number
  outputTokens?: number
}

// Knowledge Base types

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

// Combined type
export type ViewState =
  | CoreView | AiFeatureView | ToolView | WorkspaceView
  | DataView | SearchView | ExperimentalView
