import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDocCompareStore } from '../doc-compare.store'
import type { DocComparison, DocHighlight } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllDocComparisons: vi.fn(() => Promise.resolve([])),
  putDocComparison: vi.fn(() => Promise.resolve()),
  deleteDocComparisonFromDb: vi.fn(() => Promise.resolve()),
}))

describe('DocCompareStore', () => {
  beforeEach(() => {
    useDocCompareStore.setState({
      comparisons: [],
      selectedComparisonId: null,
    })
  })

  it('should create a comparison', () => {
    useDocCompareStore.getState().createComparison('v1 vs v2', 'Hello world', 'Hello earth')

    const comparisons = useDocCompareStore.getState().comparisons
    expect(comparisons).toHaveLength(1)
    expect(comparisons[0].title).toBe('v1 vs v2')
    expect(comparisons[0].docA).toBe('Hello world')
    expect(comparisons[0].docB).toBe('Hello earth')
    expect(comparisons[0].diffSummary).toBe('')
    expect(comparisons[0].highlights).toEqual([])
  })

  it('should delete a comparison', () => {
    const now = new Date().toISOString()
    useDocCompareStore.setState({
      comparisons: [
        { id: 'dc-1', title: 'A', docA: 'a', docB: 'b', diffSummary: '', highlights: [], createdAt: now },
        { id: 'dc-2', title: 'B', docA: 'c', docB: 'd', diffSummary: '', highlights: [], createdAt: now },
      ],
      selectedComparisonId: 'dc-1',
    })

    useDocCompareStore.getState().deleteComparison('dc-1')

    const state = useDocCompareStore.getState()
    expect(state.comparisons).toHaveLength(1)
    expect(state.comparisons[0].id).toBe('dc-2')
    expect(state.selectedComparisonId).toBeNull()
  })

  it('should add a highlight', () => {
    const now = new Date().toISOString()
    useDocCompareStore.setState({
      comparisons: [
        { id: 'dc-1', title: 'A', docA: 'a', docB: 'b', diffSummary: '', highlights: [], createdAt: now },
      ],
    })

    const highlight: DocHighlight = {
      id: 'hl-1',
      type: 'changed',
      lineStart: 1,
      lineEnd: 3,
      text: 'modified paragraph',
      aiComment: 'Wording improved',
    }

    useDocCompareStore.getState().addHighlight('dc-1', highlight)

    const comp = useDocCompareStore.getState().comparisons[0]
    expect(comp.highlights).toHaveLength(1)
    expect(comp.highlights[0].type).toBe('changed')
    expect(comp.highlights[0].aiComment).toBe('Wording improved')
  })

  it('should not modify other comparisons when adding highlight', () => {
    const now = new Date().toISOString()
    useDocCompareStore.setState({
      comparisons: [
        { id: 'dc-1', title: 'A', docA: 'a', docB: 'b', diffSummary: '', highlights: [], createdAt: now },
        { id: 'dc-2', title: 'B', docA: 'c', docB: 'd', diffSummary: '', highlights: [], createdAt: now },
      ],
    })

    const highlight: DocHighlight = { id: 'hl-1', type: 'added', lineStart: 5, lineEnd: 5, text: 'new line' }
    useDocCompareStore.getState().addHighlight('dc-1', highlight)

    expect(useDocCompareStore.getState().comparisons[1].highlights).toEqual([])
  })

  it('should select and deselect a comparison', () => {
    useDocCompareStore.getState().selectComparison('dc-1')
    expect(useDocCompareStore.getState().selectedComparisonId).toBe('dc-1')

    useDocCompareStore.getState().selectComparison(null)
    expect(useDocCompareStore.getState().selectedComparisonId).toBeNull()
  })

  it('should not clear selectedComparisonId when deleting a different comparison', () => {
    const now = new Date().toISOString()
    useDocCompareStore.setState({
      comparisons: [
        { id: 'dc-1', title: 'A', docA: 'a', docB: 'b', diffSummary: '', highlights: [], createdAt: now },
        { id: 'dc-2', title: 'B', docA: 'c', docB: 'd', diffSummary: '', highlights: [], createdAt: now },
      ],
      selectedComparisonId: 'dc-2',
    })

    useDocCompareStore.getState().deleteComparison('dc-1')

    expect(useDocCompareStore.getState().selectedComparisonId).toBe('dc-2')
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockComparisons: DocComparison[] = [
      { id: 'dc-1', title: 'From DB', docA: 'x', docB: 'y', diffSummary: 'diff', highlights: [], createdAt: now },
    ]

    const { getAllDocComparisons } = await import('@/shared/lib/db')
    vi.mocked(getAllDocComparisons).mockResolvedValueOnce(mockComparisons)

    useDocCompareStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const comparisons = useDocCompareStore.getState().comparisons
    expect(comparisons).toHaveLength(1)
    expect(comparisons[0].title).toBe('From DB')
  })
})
