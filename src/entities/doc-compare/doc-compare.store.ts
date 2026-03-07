import { create } from 'zustand'
import type { DocComparison, DocHighlight } from '@/shared/types'
import { getAllDocComparisons, putDocComparison, deleteDocComparisonFromDb } from '@/shared/lib/db'

interface DocCompareState {
  comparisons: DocComparison[]
  selectedComparisonId: string | null

  hydrate: () => void
  createComparison: (title: string, docA: string, docB: string) => void
  deleteComparison: (id: string) => void
  addHighlight: (compId: string, highlight: DocHighlight) => void
  selectComparison: (id: string | null) => void
}

export const useDocCompareStore = create<DocCompareState>((set) => ({
  comparisons: [],
  selectedComparisonId: null,

  hydrate: () => {
    getAllDocComparisons()
      .then((comparisons) => set({ comparisons }))
      .catch(console.error)
  },

  createComparison: (title, docA, docB) => {
    const comparison: DocComparison = {
      id: crypto.randomUUID(),
      title,
      docA,
      docB,
      diffSummary: '',
      highlights: [],
      createdAt: new Date().toISOString(),
    }

    set((state) => ({ comparisons: [comparison, ...state.comparisons] }))
    putDocComparison(comparison).catch(console.error)
  },

  deleteComparison: (id) => {
    set((state) => ({
      comparisons: state.comparisons.filter((c) => c.id !== id),
      selectedComparisonId: state.selectedComparisonId === id ? null : state.selectedComparisonId,
    }))
    deleteDocComparisonFromDb(id).catch(console.error)
  },

  addHighlight: (compId, highlight) => {
    set((state) => ({
      comparisons: state.comparisons.map((c) => {
        if (c.id !== compId) return c
        const updated = {
          ...c,
          highlights: [...c.highlights, highlight],
        }
        putDocComparison(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectComparison: (id) => {
    set({ selectedComparisonId: id })
  },
}))
