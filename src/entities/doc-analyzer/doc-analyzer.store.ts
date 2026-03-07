import { create } from 'zustand'
import type { DocAnalysis, DocAnalysisType, AnalyzedField } from '@/shared/types'
import {
  getAllDocAnalyses,
  putDocAnalysis,
  deleteDocAnalysisFromDb,
} from '@/shared/lib/db'

interface DocAnalyzerState {
  analyses: DocAnalysis[]
  selectedAnalysisId: string | null

  hydrate: () => void
  createAnalysis: (title: string, type: DocAnalysisType, imageUrl: string, extractedText: string) => void
  addField: (analysisId: string, field: AnalyzedField) => void
  deleteAnalysis: (id: string) => void
  selectAnalysis: (id: string | null) => void
}

export const useDocAnalyzerStore = create<DocAnalyzerState>((set) => ({
  analyses: [],
  selectedAnalysisId: null,

  hydrate: () => {
    getAllDocAnalyses()
      .then((analyses) => {
        set({ analyses })
      })
      .catch(console.error)
  },

  createAnalysis: (title, type, imageUrl, extractedText) => {
    const analysis: DocAnalysis = {
      id: crypto.randomUUID(),
      title,
      type,
      imageUrl,
      extractedText,
      fields: [],
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      analyses: [analysis, ...state.analyses],
    }))

    putDocAnalysis(analysis).catch(console.error)
  },

  addField: (analysisId, field) => {
    set((state) => ({
      analyses: state.analyses.map((a) => {
        if (a.id !== analysisId) return a
        const updated = { ...a, fields: [...a.fields, field] }
        putDocAnalysis(updated).catch(console.error)
        return updated
      }),
    }))
  },

  deleteAnalysis: (id) => {
    set((state) => ({
      analyses: state.analyses.filter((a) => a.id !== id),
      selectedAnalysisId: state.selectedAnalysisId === id ? null : state.selectedAnalysisId,
    }))

    deleteDocAnalysisFromDb(id).catch(console.error)
  },

  selectAnalysis: (id) => {
    set({ selectedAnalysisId: id })
  },
}))
