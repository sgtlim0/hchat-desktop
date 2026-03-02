import type { Session, Message } from '@/shared/types'

interface ImportedData {
  session: Session
  messages: Message[]
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
