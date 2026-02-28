import { create } from 'zustand'
import type { Session, Message, ViewState } from '@/shared/types'
import { mockSessions, mockMessages } from '@/shared/lib/mock-data'

interface SessionState {
  sessions: Session[]
  currentSessionId: string | null
  messages: Record<string, Message[]>
  view: ViewState
  searchOpen: boolean

  // Actions
  setView: (view: ViewState) => void
  selectSession: (id: string) => void
  createSession: (title?: string) => void
  deleteSession: (id: string) => void
  toggleFavorite: (id: string) => void
  renameSession: (id: string, title: string) => void
  addMessage: (sessionId: string, message: Message) => void
  setSearchOpen: (open: boolean) => void
  goHome: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: mockSessions,
  currentSessionId: null,
  messages: mockMessages,
  view: 'home',
  searchOpen: false,

  setView: (view) => set({ view }),

  selectSession: (id) => set({ currentSessionId: id, view: 'chat' }),

  createSession: (title) => {
    const id = `session-${Date.now()}`
    const newSession: Session = {
      id,
      title: title ?? '새 채팅',
      modelId: 'claude-sonnet-4',
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
  },

  deleteSession: (id) =>
    set((state) => {
      const { [id]: _, ...restMessages } = state.messages
      return {
        sessions: state.sessions.filter((s) => s.id !== id),
        messages: restMessages,
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        view: state.currentSessionId === id ? 'home' : state.view,
      }
    }),

  toggleFavorite: (id) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      ),
    })),

  renameSession: (id, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title } : s
      ),
    })),

  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] ?? []), message],
      },
    })),

  setSearchOpen: (open) => set({ searchOpen: open }),

  goHome: () => set({ currentSessionId: null, view: 'home' }),
}))
