import type { Session, Message, MessageSegment } from '@/shared/types'

interface ImportedData {
  session: Session
  messages: Message[]
}

export type ImportSource = 'hchat' | 'chatgpt' | 'claude' | 'unknown'

export function detectSource(data: unknown): ImportSource {
  if (!data || typeof data !== 'object') return 'unknown'
  if (Array.isArray(data) && data.length > 0 && data[0]?.mapping) return 'chatgpt'
  if ('chat_messages' in (data as Record<string, unknown>)) return 'claude'
  const obj = data as Record<string, unknown>
  if (obj.session && obj.messages) return 'hchat'
  return 'unknown'
}

export function importFromAnySource(jsonString: string): ImportedData {
  const parsed = JSON.parse(jsonString)
  const source = detectSource(parsed)

  switch (source) {
    case 'chatgpt': return convertChatGPT(parsed)
    case 'claude': return convertClaude(parsed)
    case 'hchat': return parseImportJson(jsonString)
    default: throw new Error('Unsupported import format. Supported: H Chat, ChatGPT, Claude')
  }
}

function convertChatGPT(data: unknown): ImportedData {
  const conversations = data as Array<{
    title?: string
    create_time?: number
    mapping?: Record<string, {
      message?: {
        author?: { role?: string }
        content?: { parts?: string[] }
        create_time?: number
      }
    }>
  }>
  const conv = conversations[0]
  if (!conv?.mapping) throw new Error('Invalid ChatGPT format')

  const sessionId = `import-chatgpt-${Date.now()}`
  const entries = Object.values(conv.mapping)
    .filter((n) => n.message?.content?.parts?.length)
    .filter((n) => n.message?.author?.role === 'user' || n.message?.author?.role === 'assistant')
    .sort((a, b) => (a.message?.create_time ?? 0) - (b.message?.create_time ?? 0))

  const messages: Message[] = entries.map((entry, i) => {
    const msg = entry.message!
    const text = msg.content!.parts!.join('\n')
    const segment: MessageSegment = { type: 'text', content: text }
    return {
      id: `msg-${Date.now()}-${i}`,
      sessionId,
      role: msg.author!.role as 'user' | 'assistant',
      segments: [segment],
      createdAt: msg.create_time ? new Date(msg.create_time * 1000).toISOString() : new Date().toISOString(),
    }
  })

  return {
    session: {
      id: sessionId,
      title: conv.title ?? 'ChatGPT Import',
      modelId: 'gpt-4o',
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: ['imported', 'chatgpt'],
      createdAt: conv.create_time ? new Date(conv.create_time * 1000).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: messages[messages.length - 1]?.segments[0]?.content,
    },
    messages,
  }
}

function convertClaude(data: unknown): ImportedData {
  const obj = data as {
    name?: string
    chat_messages?: Array<{ sender?: string; text?: string; created_at?: string }>
    created_at?: string
  }
  if (!obj.chat_messages) throw new Error('Invalid Claude format')

  const sessionId = `import-claude-${Date.now()}`
  const messages: Message[] = obj.chat_messages
    .filter((cm) => cm.sender && cm.text)
    .map((cm, i) => ({
      id: `msg-${Date.now()}-${i}`,
      sessionId,
      role: (cm.sender === 'human' ? 'user' : 'assistant') as 'user' | 'assistant',
      segments: [{ type: 'text' as const, content: cm.text! }],
      createdAt: cm.created_at ?? new Date().toISOString(),
    }))

  return {
    session: {
      id: sessionId,
      title: obj.name ?? 'Claude Import',
      modelId: 'anthropic.claude-sonnet-v2',
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: ['imported', 'claude'],
      createdAt: obj.created_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: messages[messages.length - 1]?.segments[0]?.content,
    },
    messages,
  }
}

function isValidSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.modelId === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    Array.isArray(obj.tags)
  )
}

function isValidMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.sessionId === 'string' &&
    (obj.role === 'user' || obj.role === 'assistant') &&
    Array.isArray(obj.segments) &&
    typeof obj.createdAt === 'string'
  )
}

export function parseImportJson(jsonString: string): ImportedData {
  const parsed = JSON.parse(jsonString)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON structure')
  }

  if (!isValidSession(parsed.session)) {
    throw new Error('Invalid session data')
  }

  if (!Array.isArray(parsed.messages)) {
    throw new Error('Invalid messages data')
  }

  for (const msg of parsed.messages) {
    if (!isValidMessage(msg)) {
      throw new Error('Invalid message data')
    }
  }

  // Generate new IDs to avoid collisions
  const newSessionId = `session-${Date.now()}-imported`
  const now = new Date().toISOString()

  const session: Session = {
    ...parsed.session,
    id: newSessionId,
    isStreaming: false,
    createdAt: parsed.session.createdAt,
    updatedAt: now,
  }

  const messages: Message[] = parsed.messages.map((msg: Message, index: number) => ({
    ...msg,
    id: `msg-${Date.now()}-import-${index}`,
    sessionId: newSessionId,
  }))

  return { session, messages }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
