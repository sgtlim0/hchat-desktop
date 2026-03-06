import { create } from 'zustand'
import type { WorkflowSuggestion } from '@/shared/types'
import {
  getAllWorkflowSuggestions, putWorkflowSuggestion, deleteWorkflowSuggestionFromDb,
} from '@/shared/lib/db'

interface AutoWorkflowState {
  suggestions: WorkflowSuggestion[]
  filterStatus: WorkflowSuggestion['status'] | 'all'
  totalSavings: { tokens: number; cost: number; timeMinutes: number }

  hydrate: () => Promise<void>
  addSuggestion: (suggestion: WorkflowSuggestion) => Promise<void>
  acceptSuggestion: (id: string, workflowId: string) => Promise<void>
  dismissSuggestion: (id: string) => Promise<void>
  removeSuggestion: (id: string) => Promise<void>
  setFilterStatus: (status: WorkflowSuggestion['status'] | 'all') => void
  detectPatterns: (recentPrompts: string[]) => void
}

function computeSavings(suggestions: WorkflowSuggestion[]) {
  const accepted = suggestions.filter((s) => s.status === 'accepted')
  return accepted.reduce(
    (acc, s) => ({
      tokens: acc.tokens + s.estimatedSavings.tokens,
      cost: acc.cost + s.estimatedSavings.cost,
      timeMinutes: acc.timeMinutes + s.estimatedSavings.timeMinutes,
    }),
    { tokens: 0, cost: 0, timeMinutes: 0 },
  )
}

export const useAutoWorkflowStore = create<AutoWorkflowState>()((set, get) => ({
  suggestions: [],
  filterStatus: 'all',
  totalSavings: { tokens: 0, cost: 0, timeMinutes: 0 },

  hydrate: async () => {
    const suggestions = await getAllWorkflowSuggestions()
    set({ suggestions, totalSavings: computeSavings(suggestions) })
  },

  addSuggestion: async (suggestion) => {
    await putWorkflowSuggestion(suggestion)
    set((s) => {
      const suggestions = [suggestion, ...s.suggestions]
      return { suggestions, totalSavings: computeSavings(suggestions) }
    })
  },

  acceptSuggestion: async (id, workflowId) => {
    const suggestion = get().suggestions.find((s) => s.id === id)
    if (!suggestion) return
    const updated = { ...suggestion, status: 'accepted' as const, workflowId }
    await putWorkflowSuggestion(updated)
    set((s) => {
      const suggestions = s.suggestions.map((sg) => (sg.id === id ? updated : sg))
      return { suggestions, totalSavings: computeSavings(suggestions) }
    })
  },

  dismissSuggestion: async (id) => {
    const suggestion = get().suggestions.find((s) => s.id === id)
    if (!suggestion) return
    const updated = { ...suggestion, status: 'dismissed' as const }
    await putWorkflowSuggestion(updated)
    set((s) => {
      const suggestions = s.suggestions.map((sg) => (sg.id === id ? updated : sg))
      return { suggestions, totalSavings: computeSavings(suggestions) }
    })
  },

  removeSuggestion: async (id) => {
    await deleteWorkflowSuggestionFromDb(id)
    set((s) => {
      const suggestions = s.suggestions.filter((sg) => sg.id !== id)
      return { suggestions, totalSavings: computeSavings(suggestions) }
    })
  },

  setFilterStatus: (filterStatus) => set({ filterStatus }),

  detectPatterns: (recentPrompts) => {
    const freq = new Map<string, number>()
    for (const prompt of recentPrompts) {
      const normalized = prompt.toLowerCase().trim().slice(0, 100)
      freq.set(normalized, (freq.get(normalized) ?? 0) + 1)
    }
    const now = new Date().toISOString()
    const existing = new Set(get().suggestions.map((s) => s.pattern))

    for (const [pattern, count] of freq) {
      if (count >= 3 && !existing.has(pattern)) {
        const suggestion: WorkflowSuggestion = {
          id: crypto.randomUUID(),
          pattern,
          description: `"${pattern.slice(0, 50)}..." 패턴이 ${count}회 반복됨`,
          frequency: count,
          lastDetected: now,
          status: 'pending',
          estimatedSavings: {
            tokens: count * 500,
            cost: count * 0.005,
            timeMinutes: count * 2,
          },
          createdAt: now,
        }
        get().addSuggestion(suggestion)
      }
    }
  },
}))
