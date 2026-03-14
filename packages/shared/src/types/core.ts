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
