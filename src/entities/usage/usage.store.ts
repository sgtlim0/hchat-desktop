import { create } from 'zustand'
import type { UsageEntry, UsageCategory } from '@/shared/types'
import { putUsage, getAllUsages, clearAllUsages } from '@/shared/lib/db'
import { MODELS } from '@/shared/constants'

export interface CategorySummary {
  category: UsageCategory
  totalEntries: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
}

interface UsageState {
  entries: UsageEntry[]
  hydrated: boolean

  hydrate: () => Promise<void>
  addUsage: (entry: UsageEntry) => void
  getSessionUsage: (sessionId: string) => UsageEntry[]
  getModelUsage: (modelId: string) => UsageEntry[]
  getTotalCost: () => number
  getCategoryUsage: (category: UsageCategory) => UsageEntry[]
  getCategoryCost: (category: UsageCategory) => number
  getCategorySummary: () => CategorySummary[]
  clearAll: () => Promise<void>
}

export const useUsageStore = create<UsageState>((set, get) => ({
  entries: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const entries = await getAllUsages()
      set({ entries, hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate usage store:', error)
      set({ hydrated: true })
    }
  },

  addUsage: (entry) => {
    set((state) => ({ entries: [entry, ...state.entries] }))
    putUsage(entry).catch(console.error)
  },

  getSessionUsage: (sessionId) => {
    return get().entries.filter((e) => e.sessionId === sessionId)
  },

  getModelUsage: (modelId) => {
    return get().entries.filter((e) => e.modelId === modelId)
  },

  getTotalCost: () => {
    return get().entries.reduce((sum, e) => sum + e.cost, 0)
  },

  getCategoryUsage: (category) => {
    return get().entries.filter((e) => (e.category ?? 'chat') === category)
  },

  getCategoryCost: (category) => {
    return get().entries
      .filter((e) => (e.category ?? 'chat') === category)
      .reduce((sum, e) => sum + e.cost, 0)
  },

  getCategorySummary: () => {
    const categories: UsageCategory[] = ['chat', 'translate', 'doc-write', 'ocr', 'image-gen', 'data-analysis']
    return categories.map((cat) => {
      const entries = get().entries.filter((e) => (e.category ?? 'chat') === cat)
      return {
        category: cat,
        totalEntries: entries.length,
        totalInputTokens: entries.reduce((s, e) => s + e.inputTokens, 0),
        totalOutputTokens: entries.reduce((s, e) => s + e.outputTokens, 0),
        totalCost: entries.reduce((s, e) => s + e.cost, 0),
      }
    })
  },

  clearAll: async () => {
    set({ entries: [] })
    await clearAllUsages()
  },
}))

/**
 * Calculate cost for a usage entry based on model pricing.
 * Cost in MODELS is per 1M tokens.
 */
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = MODELS.find((m) => m.id === modelId)
  if (!model) return 0
  return (inputTokens * model.cost.input + outputTokens * model.cost.output) / 1_000_000
}
