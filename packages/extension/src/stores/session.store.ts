import { create } from 'zustand'
import Dexie from 'dexie'
import type { Session, Message } from '@hchat/shared/types/core'
import type { ExtPage } from '@ext/shared/types'

// IndexedDB via Dexie
class ExtDatabase extends Dexie {
  sessions!: Dexie.Table<Session, string>
  messages!: Dexie.Table<Message, string>

  constructor() {
    super('hchat-ext')
    this.version(1).stores({
      sessions: 'id, updatedAt',
      messages: 'id, sessionId',
    })
  }
}

const db = new ExtDatabase()

interface ExtSessionState {
  sessions: Session[]
  messages: Record<string, Message[]>
  currentSessionId: string | null
  currentPage: ExtPage
  isStreaming: boolean
  hydrated: boolean

  hydrate: () => Promise<void>
  createSession: (modelId: string) => string
  deleteSession: (id: string) => void
  selectSession: (id: string) => void
  setPage: (page: ExtPage) => void
  addMessage: (sessionId: string, message: Message) => void
  updateLastMessage: (sessionId: string, updater: (msg: Message) => Message) => void
  setStreaming: (streaming: boolean) => void
  getRecentSessions: (limit: number) => Session[]
}

export const useExtSessionStore = create<ExtSessionState>((set, get) => ({
  sessions: [],
  messages: {},
  currentSessionId: null,
  currentPage: 'chat',
  isStreaming: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const sessions = await db.sessions.orderBy('updatedAt').reverse().toArray()
      const allMessages = await db.messages.toArray()
      const messagesMap: Record<string, Message[]> = {}
      for (const msg of allMessages) {
        if (!messagesMap[msg.sessionId]) {
          messagesMap[msg.sessionId] = []
        }
        messagesMap[msg.sessionId].push(msg)
      }
      // Sort messages by createdAt within each session
      for (const key of Object.keys(messagesMap)) {
        messagesMap[key].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      }
      set({ sessions, messages: messagesMap, hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate extension sessions:', error)
      set({ hydrated: true })
    }
  },

  createSession: (modelId: string) => {
    const id = `ext-session-${Date.now()}`
    const now = new Date().toISOString()
    const newSession: Session = {
      id,
      title: 'New Chat',
      modelId,
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: id,
      messages: { ...state.messages, [id]: [] },
      currentPage: 'chat' as ExtPage,
    }))
    db.sessions.put(newSession).catch(console.error)
    return id
  },

  deleteSession: (id: string) => {
    set((state) => {
      const { [id]: _deleted, ...restMessages } = state.messages
      return {
        sessions: state.sessions.filter((s) => s.id !== id),
        messages: restMessages,
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
      }
    })
    db.sessions.delete(id).catch(console.error)
    db.messages.where('sessionId').equals(id).delete().catch(console.error)
  },

  selectSession: (id: string) => {
    set({ currentSessionId: id, currentPage: 'chat' })
  },

  setPage: (page: ExtPage) => {
    set({ currentPage: page })
  },

  addMessage: (sessionId: string, message: Message) => {
    set((state) => {
      const existing = state.messages[sessionId] ?? []
      const updatedSession = state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, lastMessage: message.segments[0]?.content?.slice(0, 100), updatedAt: new Date().toISOString() }
          : s,
      )
      return {
        messages: { ...state.messages, [sessionId]: [...existing, message] },
        sessions: updatedSession,
      }
    })
    db.messages.put(message).catch(console.error)
    const session = get().sessions.find((s) => s.id === sessionId)
    if (session) {
      db.sessions.put(session).catch(console.error)
    }
  },

  updateLastMessage: (sessionId: string, updater: (msg: Message) => Message) => {
    set((state) => {
      const msgs = state.messages[sessionId]
      if (!msgs || msgs.length === 0) return state
      const lastMsg = msgs[msgs.length - 1]
      const updated = updater(lastMsg)
      return {
        messages: {
          ...state.messages,
          [sessionId]: [...msgs.slice(0, -1), updated],
        },
      }
    })
    // Persist the updated message
    const msgs = get().messages[sessionId]
    if (msgs && msgs.length > 0) {
      db.messages.put(msgs[msgs.length - 1]).catch(console.error)
    }
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming })
  },

  getRecentSessions: (limit: number) => {
    return get().sessions.slice(0, limit)
  },
}))
