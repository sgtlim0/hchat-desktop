import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInsightsStore } from '../insights.store'
import type { SessionCluster, SessionPattern, ModelRecommendation } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllInsightReports: vi.fn(() => Promise.resolve([])),
  putInsightReport: vi.fn(() => Promise.resolve()),
  deleteInsightReportFromDb: vi.fn(() => Promise.resolve()),
}))

describe('InsightsStore', () => {
  beforeEach(() => {
    useInsightsStore.setState({
      reports: [],
      clusters: [],
      patterns: [],
      qualityScores: [],
      recommendations: [],
      isAnalyzing: false,
    })
  })

  it('should add an insight report', () => {
    const { addReport } = useInsightsStore.getState()

    addReport({
      period: 'weekly',
      totalSessions: 50,
      totalCost: 10.5,
      totalTokens: 100000,
      modelBreakdown: {
        'claude-3-5-sonnet': { sessions: 30, cost: 7.5, tokens: 70000 },
        'gpt-4o': { sessions: 20, cost: 3.0, tokens: 30000 },
      },
      recommendations: ['Use Haiku for simple queries', 'Batch similar requests'],
    })

    const reports = useInsightsStore.getState().reports
    expect(reports).toHaveLength(1)
    expect(reports[0].period).toBe('weekly')
    expect(reports[0].totalCost).toBe(10.5)
    expect(reports[0].id).toMatch(/^report-/)
  })

  it('should delete a report', () => {
    const { addReport, deleteReport } = useInsightsStore.getState()

    // Add two reports
    addReport({ period: 'weekly', totalSessions: 10, totalCost: 5, totalTokens: 5000, modelBreakdown: {}, recommendations: [] })
    addReport({ period: 'monthly', totalSessions: 100, totalCost: 50, totalTokens: 50000, modelBreakdown: {}, recommendations: [] })

    const reports = useInsightsStore.getState().reports
    const reportId = reports[0].id

    deleteReport(reportId)

    const remainingReports = useInsightsStore.getState().reports
    expect(remainingReports).toHaveLength(1)
    expect(remainingReports[0].period).toBe('weekly')
  })

  it('should set session clusters', () => {
    const { setClusters } = useInsightsStore.getState()

    const clusters: SessionCluster[] = [
      { id: 'cluster-1', name: 'Coding Sessions', sessionIds: ['s1', 's2', 's3'], similarity: 0.85 },
      { id: 'cluster-2', name: 'Writing Sessions', sessionIds: ['s4', 's5'], similarity: 0.92 },
    ]

    setClusters(clusters)

    expect(useInsightsStore.getState().clusters).toEqual(clusters)
  })

  it('should set session patterns', () => {
    const { setPatterns } = useInsightsStore.getState()

    const patterns: SessionPattern[] = [
      { id: 'pattern-1', pattern: 'Always asks for code review', frequency: 15, suggestion: 'Create a code review template' },
      { id: 'pattern-2', pattern: 'Frequently translates documents', frequency: 8, suggestion: 'Use batch translation' },
    ]

    setPatterns(patterns)

    expect(useInsightsStore.getState().patterns).toEqual(patterns)
  })

  it('should add quality score', () => {
    const { addQualityScore } = useInsightsStore.getState()

    addQualityScore({
      sessionId: 'session-1',
      promptId: 'prompt-1',
      clarity: 0.85,
      specificity: 0.90,
      overall: 0.875,
      suggestions: ['Add more context', 'Be more specific about the output format'],
    })

    const scores = useInsightsStore.getState().qualityScores
    expect(scores).toHaveLength(1)
    expect(scores[0].clarity).toBe(0.85)
    expect(scores[0].overall).toBe(0.875)
    expect(scores[0].id).toMatch(/^score-/)
  })

  it('should set model recommendations', () => {
    const { setRecommendations } = useInsightsStore.getState()

    const recommendations: ModelRecommendation[] = [
      { modelId: 'claude-3-5-haiku', confidence: 0.95, reason: 'Simple query', estimatedCost: 0.001 },
      { modelId: 'gpt-4o', confidence: 0.80, reason: 'Good for this type', estimatedCost: 0.003 },
    ]

    setRecommendations(recommendations)

    expect(useInsightsStore.getState().recommendations).toEqual(recommendations)
  })

  it('should toggle analyzing state', () => {
    const { setIsAnalyzing } = useInsightsStore.getState()

    expect(useInsightsStore.getState().isAnalyzing).toBe(false)

    setIsAnalyzing(true)
    expect(useInsightsStore.getState().isAnalyzing).toBe(true)

    setIsAnalyzing(false)
    expect(useInsightsStore.getState().isAnalyzing).toBe(false)
  })

  it('should clear all data', () => {
    const { addReport, addQualityScore, setClusters, setPatterns, setRecommendations, clearAll } = useInsightsStore.getState()

    // Add various data
    addReport({ period: 'weekly', totalSessions: 10, totalCost: 5, totalTokens: 5000, modelBreakdown: {}, recommendations: [] })
    addQualityScore({ sessionId: 's1', promptId: 'p1', clarity: 0.8, specificity: 0.9, overall: 0.85, suggestions: [] })
    setClusters([{ id: 'c1', name: 'Test', sessionIds: ['s1'], similarity: 0.9 }])
    setPatterns([{ id: 'p1', pattern: 'Test', frequency: 5, suggestion: 'Test' }])
    setRecommendations([{ modelId: 'm1', confidence: 0.9, reason: 'Test', estimatedCost: 0.01 }])

    clearAll()

    const state = useInsightsStore.getState()
    expect(state.reports).toHaveLength(0)
    expect(state.qualityScores).toHaveLength(0)
    expect(state.clusters).toHaveLength(0)
    expect(state.patterns).toHaveLength(0)
    expect(state.recommendations).toHaveLength(0)
  })

  it('should hydrate reports from database', async () => {
    const { hydrate } = useInsightsStore.getState()
    const mockReports = [
      { id: 'r1', period: 'weekly', totalSessions: 10, totalCost: 5, totalTokens: 5000, modelBreakdown: {}, recommendations: [], createdAt: '2026-01-01' },
    ]

    const { getAllInsightReports } = await import('@/shared/lib/db')
    vi.mocked(getAllInsightReports).mockResolvedValueOnce(mockReports)

    hydrate()

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(useInsightsStore.getState().reports).toEqual(mockReports)
  })
})