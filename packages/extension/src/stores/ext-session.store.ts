import { create } from 'zustand'
import type { Message, Session } from '@hchat/shared'
import { DEFAULT_MODEL_ID } from '@hchat/shared'
import { db } from '../lib/ext-db'

interface ExtSessionState {
  sessions: Session[]
  currentSessionId: string | null
  messages: Record<string, Message[]>

  createSession: (modelId?: string, title?: string, systemPrompt?: string) => string
  deleteSession: (id: string) => void
  selectSession: (id: string | null) => void
  addMessage: (sessionId: string, message: Message) => void
  updateLastAssistantMessage: (sessionId: string, text: string) => void
  clearMessages: (sessionId: string) => void
  getCurrentMessages: () => Message[]
  loadSessions: () => Promise<void>
  updateSessionTitle: (id: string, title: string) => void
}

export const useExtSessionStore = create<ExtSessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: {},

  createSession: (modelId, title, _systemPrompt) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const session: Session = {
      id,
      title: title || 'New Chat',
      modelId: modelId || DEFAULT_MODEL_ID,
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    }

    set(state => ({
      sessions: [session, ...state.sessions],
      currentSessionId: id,
      messages: { ...state.messages, [id]: [] },
    }))

    db.sessions.put(session).catch(() => {})

    return id
  },

  deleteSession: (id) => {
    set(state => {
      const { [id]: _, ...rest } = state.messages
      return {
        sessions: state.sessions.filter(s => s.id !== id),
        messages: rest,
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
      }
    })
    db.sessions.delete(id).catch(() => {})
    db.messages.where('sessionId').equals(id).delete().catch(() => {})
  },

  selectSession: (id) => {
    set({ currentSessionId: id })
    if (id && !get().messages[id]) {
      db.messages.where('sessionId').equals(id).toArray().then(msgs => {
        set(state => ({
          messages: { ...state.messages, [id]: msgs },
        }))
      }).catch(() => {})
    }
  },

  addMessage: (sessionId, message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
      sessions: state.sessions.map(s =>
        s.id === sessionId
          ? { ...s, updatedAt: new Date().toISOString(), lastMessage: message.segments[0]?.content?.slice(0, 100) }
          : s
      ),
    }))
    db.messages.put(message).catch(() => {})
    db.sessions.update(sessionId, { updatedAt: new Date().toISOString() }).catch(() => {})
  },

  updateLastAssistantMessage: (sessionId, text) => {
    set(state => {
      const msgs = state.messages[sessionId] || []
      const lastIdx = msgs.length - 1
      if (lastIdx < 0 || msgs[lastIdx].role !== 'assistant') {
        return state
      }
      const updated = [...msgs]
      updated[lastIdx] = {
        ...updated[lastIdx],
        segments: [{ type: 'text', content: text }],
      }
      return { messages: { ...state.messages, [sessionId]: updated } }
    })
  },

  clearMessages: (sessionId) => {
    set(state => ({
      messages: { ...state.messages, [sessionId]: [] },
    }))
    db.messages.where('sessionId').equals(sessionId).delete().catch(() => {})
  },

  getCurrentMessages: () => {
    const { currentSessionId, messages } = get()
    if (!currentSessionId) return []
    return messages[currentSessionId] || []
  },

  loadSessions: async () => {
    try {
      const sessions = await db.sessions.orderBy('updatedAt').reverse().toArray()
      set({ sessions })
    } catch {
      // IndexedDB not available
    }
  },

  updateSessionTitle: (id, title) => {
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s),
    }))
    db.sessions.update(id, { title }).catch(() => {})
  },
}))
