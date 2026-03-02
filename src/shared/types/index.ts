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

export interface Session {
  id: string
  title: string
  modelId: string
  projectId?: string
  isFavorite: boolean
  isStreaming: boolean
  pinned: boolean
  tags: string[]
  lastMessage?: string
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

export type ViewState = 'home' | 'chat' | 'settings' | 'allChats' | 'projects' | 'projectDetail' | 'quickChat' | 'memory' | 'agentSwarm' | 'schedule' | 'groupChat' | 'promptLibrary'

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

export type ExportFormat = 'markdown' | 'html' | 'json' | 'txt'

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
}

// Usage Tracking types

export interface UsageEntry {
  id: string
  sessionId: string
  modelId: string
  provider: ProviderType
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: string
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
