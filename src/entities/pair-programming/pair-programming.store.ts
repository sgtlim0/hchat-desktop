import { create } from 'zustand'
import type { PairSession, AiSuggestion } from '@/shared/types'
import { getAllPairSessions, putPairSession, deletePairSessionFromDb } from '@/shared/lib/db'

interface PairProgrammingState {
  sessions: PairSession[]
  selectedSessionId: string | null

  hydrate: () => void
  createSession: (title: string, language: string) => void
  deleteSession: (id: string) => void
  updateCode: (id: string, code: string) => void
  addSuggestion: (sessionId: string, suggestion: AiSuggestion) => void
  acceptSuggestion: (sessionId: string, suggestionId: string) => void
  selectSession: (id: string | null) => void
}

export const usePairProgrammingStore = create<PairProgrammingState>((set) => ({
  sessions: [],
  selectedSessionId: null,

  hydrate: () => {
    getAllPairSessions()
      .then((sessions) => set({ sessions }))
      .catch(console.error)
  },

  createSession: (title, language) => {
    const now = new Date().toISOString()
    const session: PairSession = {
      id: crypto.randomUUID(),
      title,
      language,
      code: '',
      aiSuggestions: [],
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ sessions: [session, ...state.sessions] }))
    putPairSession(session).catch(console.error)
  },

  deleteSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      selectedSessionId: state.selectedSessionId === id ? null : state.selectedSessionId,
    }))
    deletePairSessionFromDb(id).catch(console.error)
  },

  updateCode: (id, code) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, code, updatedAt: new Date().toISOString() }
        putPairSession(updated).catch(console.error)
        return updated
      }),
    }))
  },

  addSuggestion: (sessionId, suggestion) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const updated = {
          ...s,
          aiSuggestions: [...s.aiSuggestions, suggestion],
          updatedAt: new Date().toISOString(),
        }
        putPairSession(updated).catch(console.error)
        return updated
      }),
    }))
  },

  acceptSuggestion: (sessionId, suggestionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const updated = {
          ...s,
          aiSuggestions: s.aiSuggestions.map((sg) =>
            sg.id === suggestionId ? { ...sg, accepted: true } : sg
          ),
          updatedAt: new Date().toISOString(),
        }
        putPairSession(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectSession: (id) => {
    set({ selectedSessionId: id })
  },
}))
