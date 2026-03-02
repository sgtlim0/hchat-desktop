import { create } from 'zustand'
import type { Session, Message, ViewState } from '@/shared/types'
import { useSettingsStore } from '@/entities/settings/settings.store'
import {
  putSession,
  deleteSessionFromDb,
  putMessage,
  hydrateFromDb,
} from '@/shared/lib/db'

interface SessionState {
  sessions: Session[]
  currentSessionId: string | null
  messages: Record<string, Message[]>
  view: ViewState
  searchOpen: boolean
  hydrated: boolean

  // Actions
  hydrate: () => Promise<void>
  setView: (view: ViewState) => void
  selectSession: (id: string) => void
  createSession: (title?: string) => void
  deleteSession: (id: string) => void
  toggleFavorite: (id: string) => void
  renameSession: (id: string, title: string) => void
  addMessage: (sessionId: string, message: Message) => void
  updateLastMessage: (sessionId: string, messageId: string, updater: (msg: Message) => Message) => void
  setSessionStreaming: (sessionId: string, isStreaming: boolean) => void
  setSearchOpen: (open: boolean) => void
  goHome: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: {},
  view: 'home',
  searchOpen: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const { sessions, projects: _, messagesMap } = await hydrateFromDb()
      set({
        sessions,
        messages: messagesMap,
        hydrated: true,
      })
    } catch (error) {
      console.error('Failed to hydrate sessions from IndexedDB:', error)
      set({ hydrated: true })
    }
  },

  setView: (view) => set({ view }),

  selectSession: (id) => set({ currentSessionId: id, view: 'chat' }),

  createSession: (title) => {
    const id = `session-${Date.now()}`
    const { selectedModel } = useSettingsStore.getState()
    const newSession: Session = {
      id,
      title: title ?? '새 채팅',
      modelId: selectedModel,
      isFavorite: false,
      isStreaming: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: id,
      messages: { ...state.messages, [id]: [] },
      view: 'chat',
    }))
    putSession(newSession).catch(console.error)
  },

  deleteSession: (id) => {
    set((state) => {
      const { [id]: _, ...restMessages } = state.messages
      return {
        sessions: state.sessions.filter((s) => s.id !== id),
        messages: restMessages,
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        view: state.currentSessionId === id ? 'home' : state.view,
      }
    })
    deleteSessionFromDb(id).catch(console.error)
  },

  toggleFavorite: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      ),
    }))
    const session = get().sessions.find((s) => s.id === id)
    if (session) putSession(session).catch(console.error)
  },

  renameSession: (id, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title } : s
      ),
    }))
    const session = get().sessions.find((s) => s.id === id)
    if (session) putSession(session).catch(console.error)
  },

  addMessage: (sessionId, message) => {
    set((state) => {
      const sessionMessages = [...(state.messages[sessionId] ?? []), message]
      const lastText = message.segments.find((s) => s.type === 'text')?.content
      return {
        messages: {
          ...state.messages,
          [sessionId]: sessionMessages,
        },
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, lastMessage: lastText ?? s.lastMessage, updatedAt: new Date().toISOString() }
            : s
        ),
      }
    })
    putMessage(message).catch(console.error)
    const session = get().sessions.find((s) => s.id === sessionId)
    if (session) putSession(session).catch(console.error)
  },

  updateLastMessage: (sessionId, messageId, updater) => {
    set((state) => {
      const sessionMessages = state.messages[sessionId] ?? []
      const idx = sessionMessages.findIndex((m) => m.id === messageId)
      if (idx === -1) return state

      const updated = updater(sessionMessages[idx])
      const newMessages = [...sessionMessages]
      newMessages[idx] = updated

      return {
        messages: {
          ...state.messages,
          [sessionId]: newMessages,
        },
      }
    })
  },

  setSessionStreaming: (sessionId, isStreaming) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, isStreaming } : s
      ),
    }))
  },

  setSearchOpen: (open) => set({ searchOpen: open }),

  goHome: () => set({ currentSessionId: null, view: 'home' }),
}))
