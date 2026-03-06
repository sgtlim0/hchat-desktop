import { create } from 'zustand'
import type { CodeReviewSession, ReviewComment } from '@/shared/types'
import { getAllCodeReviewSessions, putCodeReviewSession, deleteCodeReviewSessionFromDb } from '@/shared/lib/db'

interface CodeReviewState {
  sessions: CodeReviewSession[]
  selectedSessionId: string | null

  hydrate: () => Promise<void>
  createSession: (title: string, language: string, code: string) => Promise<string>
  deleteSession: (id: string) => Promise<void>
  addComment: (sessionId: string, comment: ReviewComment) => Promise<void>
  removeComment: (sessionId: string, commentId: string) => Promise<void>
  markResolved: (id: string) => Promise<void>
  setSelectedSessionId: (id: string | null) => void
}

export const useCodeReviewStore = create<CodeReviewState>()((set, get) => ({
  sessions: [],
  selectedSessionId: null,

  hydrate: async () => {
    const sessions = await getAllCodeReviewSessions()
    set({ sessions })
  },

  createSession: async (title, language, code) => {
    const session: CodeReviewSession = {
      id: crypto.randomUUID(), title, language, code, comments: [],
      status: 'pending', createdAt: new Date().toISOString(),
    }
    await putCodeReviewSession(session)
    set((s) => ({ sessions: [session, ...s.sessions], selectedSessionId: session.id }))
    return session.id
  },

  deleteSession: async (id) => {
    await deleteCodeReviewSessionFromDb(id)
    set((s) => ({
      sessions: s.sessions.filter((ss) => ss.id !== id),
      selectedSessionId: s.selectedSessionId === id ? null : s.selectedSessionId,
    }))
  },

  addComment: async (sessionId, comment) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return
    const updated = { ...session, comments: [...session.comments, comment], status: 'reviewed' as const }
    await putCodeReviewSession(updated)
    set((s) => ({ sessions: s.sessions.map((ss) => (ss.id === sessionId ? updated : ss)) }))
  },

  removeComment: async (sessionId, commentId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return
    const updated = { ...session, comments: session.comments.filter((c) => c.id !== commentId) }
    await putCodeReviewSession(updated)
    set((s) => ({ sessions: s.sessions.map((ss) => (ss.id === sessionId ? updated : ss)) }))
  },

  markResolved: async (id) => {
    const session = get().sessions.find((s) => s.id === id)
    if (!session) return
    const updated = { ...session, status: 'resolved' as const }
    await putCodeReviewSession(updated)
    set((s) => ({ sessions: s.sessions.map((ss) => (ss.id === id ? updated : ss)) }))
  },

  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),
}))
