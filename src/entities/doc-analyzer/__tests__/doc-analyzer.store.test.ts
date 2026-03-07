import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDocAnalyzerStore } from '../doc-analyzer.store'
import type { DocAnalysis, AnalyzedField } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllDocAnalyses: vi.fn(() => Promise.resolve([])),
  putDocAnalysis: vi.fn(() => Promise.resolve()),
  deleteDocAnalysisFromDb: vi.fn(() => Promise.resolve()),
}))

const makeAnalysis = (overrides: Partial<DocAnalysis> = {}): DocAnalysis => ({
  id: 'da-1',
  title: 'Receipt',
  type: 'receipt',
  imageUrl: 'https://example.com/receipt.png',
  extractedText: 'Total: $50.00',
  fields: [],
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('DocAnalyzerStore', () => {
  beforeEach(() => {
    useDocAnalyzerStore.setState({
      analyses: [],
      selectedAnalysisId: null,
    })
  })

  it('should create an analysis', () => {
    const { createAnalysis } = useDocAnalyzerStore.getState()
    createAnalysis('Receipt', 'receipt', 'https://example.com/img.png', 'Total: $50')

    const analyses = useDocAnalyzerStore.getState().analyses
    expect(analyses).toHaveLength(1)
    expect(analyses[0].title).toBe('Receipt')
    expect(analyses[0].type).toBe('receipt')
    expect(analyses[0].imageUrl).toBe('https://example.com/img.png')
    expect(analyses[0].extractedText).toBe('Total: $50')
    expect(analyses[0].fields).toEqual([])
  })

  it('should add a field to an analysis', () => {
    useDocAnalyzerStore.setState({ analyses: [makeAnalysis({ id: 'da-1' })] })

    const field: AnalyzedField = { key: 'total', value: '$50.00', confidence: 0.98 }
    useDocAnalyzerStore.getState().addField('da-1', field)

    const analysis = useDocAnalyzerStore.getState().analyses[0]
    expect(analysis.fields).toHaveLength(1)
    expect(analysis.fields[0].key).toBe('total')
    expect(analysis.fields[0].confidence).toBe(0.98)
  })

  it('should not modify other analyses when adding field', () => {
    useDocAnalyzerStore.setState({
      analyses: [makeAnalysis({ id: 'da-1' }), makeAnalysis({ id: 'da-2', title: 'Contract' })],
    })

    const field: AnalyzedField = { key: 'vendor', value: 'ACME', confidence: 0.85 }
    useDocAnalyzerStore.getState().addField('da-1', field)

    expect(useDocAnalyzerStore.getState().analyses[1].fields).toEqual([])
  })

  it('should delete an analysis and clear selectedAnalysisId', () => {
    useDocAnalyzerStore.setState({
      analyses: [makeAnalysis({ id: 'da-1' }), makeAnalysis({ id: 'da-2' })],
      selectedAnalysisId: 'da-1',
    })

    useDocAnalyzerStore.getState().deleteAnalysis('da-1')

    const state = useDocAnalyzerStore.getState()
    expect(state.analyses).toHaveLength(1)
    expect(state.analyses[0].id).toBe('da-2')
    expect(state.selectedAnalysisId).toBeNull()
  })

  it('should not clear selectedAnalysisId when deleting a different analysis', () => {
    useDocAnalyzerStore.setState({
      analyses: [makeAnalysis({ id: 'da-1' }), makeAnalysis({ id: 'da-2' })],
      selectedAnalysisId: 'da-1',
    })

    useDocAnalyzerStore.getState().deleteAnalysis('da-2')
    expect(useDocAnalyzerStore.getState().selectedAnalysisId).toBe('da-1')
  })

  it('should select and deselect analysis', () => {
    useDocAnalyzerStore.getState().selectAnalysis('da-1')
    expect(useDocAnalyzerStore.getState().selectedAnalysisId).toBe('da-1')

    useDocAnalyzerStore.getState().selectAnalysis(null)
    expect(useDocAnalyzerStore.getState().selectedAnalysisId).toBeNull()
  })

  it('should hydrate from db', async () => {
    const { getAllDocAnalyses } = await import('@/shared/lib/db')
    const mockData = [makeAnalysis({ id: 'da-db-1' })]
    vi.mocked(getAllDocAnalyses).mockResolvedValueOnce(mockData)

    useDocAnalyzerStore.getState().hydrate()
    await vi.waitFor(() => {
      expect(useDocAnalyzerStore.getState().analyses).toHaveLength(1)
      expect(useDocAnalyzerStore.getState().analyses[0].id).toBe('da-db-1')
    })
  })
})
