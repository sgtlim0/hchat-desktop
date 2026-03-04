import { create } from 'zustand'
import type {
  PromptQualityScore,
  ModelRecommendation,
  InsightReport,
  SessionCluster,
  SessionPattern,
} from '@/shared/types'
import {
  getAllInsightReports,
  putInsightReport,
  deleteInsightReportFromDb,
} from '@/shared/lib/db'

interface InsightsState {
  reports: InsightReport[]
  clusters: SessionCluster[]
  patterns: SessionPattern[]
  qualityScores: PromptQualityScore[]
  recommendations: ModelRecommendation[]
  isAnalyzing: boolean

  hydrate: () => void
  addReport: (report: Omit<InsightReport, 'id' | 'createdAt'>) => void
  deleteReport: (id: string) => void
  setClusters: (clusters: SessionCluster[]) => void
  setPatterns: (patterns: SessionPattern[]) => void
  addQualityScore: (score: Omit<PromptQualityScore, 'id' | 'createdAt'>) => void
  setRecommendations: (recs: ModelRecommendation[]) => void
  setIsAnalyzing: (v: boolean) => void
  clearAll: () => void
}

export const useInsightsStore = create<InsightsState>((set) => ({
  reports: [],
  clusters: [],
  patterns: [],
  qualityScores: [],
  recommendations: [],
  isAnalyzing: false,

  hydrate: () => {
    getAllInsightReports()
      .then((reports) => set({ reports }))
      .catch(console.error)
  },

  addReport: (report) => {
    const now = new Date().toISOString()
    const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const newReport: InsightReport = {
      ...report,
      id,
      createdAt: now,
    }

    set((state) => ({
      reports: [newReport, ...state.reports],
    }))

    putInsightReport(newReport).catch(console.error)
  },

  deleteReport: (id) => {
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }))

    deleteInsightReportFromDb(id).catch(console.error)
  },

  setClusters: (clusters) => {
    set({ clusters })
  },

  setPatterns: (patterns) => {
    set({ patterns })
  },

  addQualityScore: (score) => {
    const now = new Date().toISOString()
    const id = `score-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const newScore: PromptQualityScore = {
      ...score,
      id,
      createdAt: now,
    }

    set((state) => ({
      qualityScores: [newScore, ...state.qualityScores],
    }))
  },

  setRecommendations: (recs) => {
    set({ recommendations: recs })
  },

  setIsAnalyzing: (v) => {
    set({ isAnalyzing: v })
  },

  clearAll: () => {
    set({
      reports: [],
      clusters: [],
      patterns: [],
      qualityScores: [],
      recommendations: [],
    })
  },
}))
