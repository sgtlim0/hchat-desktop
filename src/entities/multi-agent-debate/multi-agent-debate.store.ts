import { create } from 'zustand'
import type { MultiAgentDebateSession, DebateRole, DebateRound } from '@/shared/types'
import { getAllMultiAgentDebates, putMultiAgentDebate, deleteMultiAgentDebateFromDb } from '@/shared/lib/db'

interface MultiAgentDebateState {
  debates: MultiAgentDebateSession[]
  selectedDebateId: string | null

  hydrate: () => void
  createDebate: (topic: string, maxRounds: number) => void
  deleteDebate: (id: string) => void
  addAgent: (debateId: string, name: string, role: DebateRole, modelId: string) => void
  addRound: (debateId: string, round: DebateRound) => void
  voteRound: (debateId: string, roundId: string) => void
  setConsensus: (debateId: string, consensus: string) => void
  startDebate: (id: string) => void
  completeDebate: (id: string) => void
  selectDebate: (id: string | null) => void
}

export const useMultiAgentDebateStore = create<MultiAgentDebateState>((set) => ({
  debates: [],
  selectedDebateId: null,

  hydrate: () => {
    getAllMultiAgentDebates()
      .then((debates) => set({ debates }))
      .catch(console.error)
  },

  createDebate: (topic, maxRounds) => {
    const debate: MultiAgentDebateSession = {
      id: crypto.randomUUID(),
      topic,
      agents: [],
      rounds: [],
      status: 'setup',
      maxRounds,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({ debates: [debate, ...state.debates] }))
    putMultiAgentDebate(debate).catch(console.error)
  },

  deleteDebate: (id) => {
    set((state) => ({
      debates: state.debates.filter((d) => d.id !== id),
      selectedDebateId: state.selectedDebateId === id ? null : state.selectedDebateId,
    }))
    deleteMultiAgentDebateFromDb(id).catch(console.error)
  },

  addAgent: (debateId, name, role, modelId) => {
    const agent = {
      id: crypto.randomUUID(),
      name,
      role,
      modelId,
    }

    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== debateId) return d
        const updated = { ...d, agents: [...d.agents, agent] }
        putMultiAgentDebate(updated).catch(console.error)
        return updated
      }),
    }))
  },

  addRound: (debateId, round) => {
    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== debateId) return d
        const updated = { ...d, rounds: [...d.rounds, round] }
        putMultiAgentDebate(updated).catch(console.error)
        return updated
      }),
    }))
  },

  voteRound: (debateId, roundId) => {
    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== debateId) return d
        const updated = {
          ...d,
          rounds: d.rounds.map((r) =>
            r.id === roundId ? { ...r, votes: r.votes + 1 } : r
          ),
        }
        putMultiAgentDebate(updated).catch(console.error)
        return updated
      }),
    }))
  },

  setConsensus: (debateId, consensus) => {
    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== debateId) return d
        const updated = { ...d, consensus }
        putMultiAgentDebate(updated).catch(console.error)
        return updated
      }),
    }))
  },

  startDebate: (id) => {
    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== id) return d
        const updated = { ...d, status: 'running' as const }
        putMultiAgentDebate(updated).catch(console.error)
        return updated
      }),
    }))
  },

  completeDebate: (id) => {
    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== id) return d
        const updated = { ...d, status: 'completed' as const }
        putMultiAgentDebate(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectDebate: (id) => {
    set({ selectedDebateId: id })
  },
}))
