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

export type ViewState = 'home' | 'chat' | 'settings' | 'allChats' | 'projects' | 'projectDetail' | 'quickChat'

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
  type: 'text' | 'error' | 'done'
  content?: string
  error?: string
}
