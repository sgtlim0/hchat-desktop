import { create } from 'zustand'
import type { DebateSession, DebateRound, DebateStatus, GroupChatResponse } from '@/shared/types'

interface DebateState {
  session: DebateSession | null
  isRunning: boolean
  startDebate: (topic: string, models: string[]) => void
  addRound: (round: DebateRound) => void
  updateRoundResponse: (roundNumber: number, modelId: string, updater: (resp: GroupChatResponse) => GroupChatResponse) => void
  setStatus: (status: DebateStatus) => void
  setSummary: (summary: string) => void
  reset: () => void
}

export const useDebateStore = create<DebateState>((set) => ({
  session: null,
  isRunning: false,

  startDebate: (topic, models) =>
    set({
      session: {
        id: `debate-${Date.now()}`,
        topic,
        models,
        rounds: [],
        summary: '',
        status: 'debating',
        createdAt: new Date().toISOString(),
      },
      isRunning: true,
    }),

  addRound: (round) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          rounds: [...state.session.rounds, round],
        },
      }
    }),

  updateRoundResponse: (roundNumber, modelId, updater) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          rounds: state.session.rounds.map((round) =>
            round.roundNumber === roundNumber
              ? {
                  ...round,
                  responses: round.responses.map((resp) =>
                    resp.modelId === modelId ? updater(resp) : resp
                  ),
                }
              : round
          ),
        },
      }
    }),

  setStatus: (status) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, status },
        isRunning: status === 'debating' || status === 'summarizing',
      }
    }),

  setSummary: (summary) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, summary, status: 'done' },
        isRunning: false,
      }
    }),

  reset: () => set({ session: null, isRunning: false }),
}))
