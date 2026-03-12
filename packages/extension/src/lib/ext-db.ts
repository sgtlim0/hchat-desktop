import Dexie, { type EntityTable } from 'dexie'
import type { Message, Session } from '@hchat/shared'

interface UsageRecord {
  sessionId: string
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: string
}

const db = new Dexie('hchat-extension') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  messages: EntityTable<Message, 'id'>
  usage: EntityTable<UsageRecord, 'sessionId'>
}

db.version(1).stores({
  sessions: 'id, updatedAt, modelId',
  messages: 'id, sessionId, createdAt',
  usage: 'sessionId',
})

export { db }
export type { UsageRecord }
