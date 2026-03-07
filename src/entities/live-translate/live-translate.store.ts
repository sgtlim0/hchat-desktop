import { create } from 'zustand'
import type { LiveTranslateSession, TranslateUtterance } from '@/shared/types'
import {
  getAllLiveTranslateSessions,
  putLiveTranslateSession,
  deleteLiveTranslateSessionFromDb,
} from '@/shared/lib/db'

interface LiveTranslateState {
  sessions: LiveTranslateSession[]
  selectedSessionId: string | null

  hydrate: () => void
  createSession: (title: string, sourceLang: string, targetLang: string) => void
  deleteSession: (id: string) => void
  addUtterance: (sessionId: string, utterance: TranslateUtterance) => void
  toggleActive: (id: string) => void
  selectSession: (id: string | null) => void
}

export const useLiveTranslateStore = create<LiveTranslateState>((set) => ({
  sessions: [],
  selectedSessionId: null,

  hydrate: () => {
    getAllLiveTranslateSessions()
      .then((sessions) => {
        set({ sessions })
      })
      .catch(console.error)
  },

  createSession: (title, sourceLang, targetLang) => {
    const session: LiveTranslateSession = {
      id: crypto.randomUUID(),
      title,
      sourceLang,
      targetLang,
      transcripts: [],
      isActive: false,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      sessions: [session, ...state.sessions],
    }))

    putLiveTranslateSession(session).catch(console.error)
  },

  deleteSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      selectedSessionId: state.selectedSessionId === id ? null : state.selectedSessionId,
    }))

    deleteLiveTranslateSessionFromDb(id).catch(console.error)
  },

  addUtterance: (sessionId, utterance) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const updated = { ...s, transcripts: [...s.transcripts, utterance] }
        putLiveTranslateSession(updated).catch(console.error)
        return updated
      }),
    }))
  },

  toggleActive: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, isActive: !s.isActive }
        putLiveTranslateSession(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectSession: (id) => {
    set({ selectedSessionId: id })
  },
}))
