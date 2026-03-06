import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAutoWorkflowStore } from '../auto-workflow.store'

vi.mock('@/shared/lib/db', () => ({
  getAllWorkflowSuggestions: vi.fn().mockResolvedValue([]),
  putWorkflowSuggestion: vi.fn().mockResolvedValue(undefined),
  deleteWorkflowSuggestionFromDb: vi.fn().mockResolvedValue(undefined),
}))

const makeSuggestion = (id: string, status: 'pending' | 'accepted' | 'dismissed' = 'pending') => ({
  id,
  pattern: `pattern-${id}`,
  description: `Suggestion ${id}`,
  frequency: 5,
  lastDetected: '2026-01-01T00:00:00Z',
  status,
  estimatedSavings: { tokens: 1000, cost: 0.01, timeMinutes: 5 },
  createdAt: '2026-01-01T00:00:00Z',
})

describe('AutoWorkflowStore', () => {
  beforeEach(() => {
    useAutoWorkflowStore.setState({
      suggestions: [], filterStatus: 'all', totalSavings: { tokens: 0, cost: 0, timeMinutes: 0 },
    })
  })

  it('should have empty initial state', () => {
    const s = useAutoWorkflowStore.getState()
    expect(s.suggestions).toEqual([])
    expect(s.filterStatus).toBe('all')
    expect(s.totalSavings).toEqual({ tokens: 0, cost: 0, timeMinutes: 0 })
  })

  it('should hydrate from db', async () => {
    const { getAllWorkflowSuggestions } = await import('@/shared/lib/db')
    vi.mocked(getAllWorkflowSuggestions).mockResolvedValue([makeSuggestion('1', 'accepted')])
    await useAutoWorkflowStore.getState().hydrate()
    expect(useAutoWorkflowStore.getState().suggestions).toHaveLength(1)
    expect(useAutoWorkflowStore.getState().totalSavings.tokens).toBe(1000)
  })

  it('should add a suggestion', async () => {
    await useAutoWorkflowStore.getState().addSuggestion(makeSuggestion('1'))
    expect(useAutoWorkflowStore.getState().suggestions).toHaveLength(1)
  })

  it('should accept a suggestion and update savings', async () => {
    await useAutoWorkflowStore.getState().addSuggestion(makeSuggestion('1'))
    await useAutoWorkflowStore.getState().acceptSuggestion('1', 'wf-1')
    const s = useAutoWorkflowStore.getState()
    expect(s.suggestions[0].status).toBe('accepted')
    expect(s.suggestions[0].workflowId).toBe('wf-1')
    expect(s.totalSavings.tokens).toBe(1000)
  })

  it('should dismiss a suggestion', async () => {
    await useAutoWorkflowStore.getState().addSuggestion(makeSuggestion('1'))
    await useAutoWorkflowStore.getState().dismissSuggestion('1')
    expect(useAutoWorkflowStore.getState().suggestions[0].status).toBe('dismissed')
  })

  it('should remove a suggestion', async () => {
    await useAutoWorkflowStore.getState().addSuggestion(makeSuggestion('1'))
    await useAutoWorkflowStore.getState().removeSuggestion('1')
    expect(useAutoWorkflowStore.getState().suggestions).toHaveLength(0)
  })

  it('should set filter status', () => {
    useAutoWorkflowStore.getState().setFilterStatus('pending')
    expect(useAutoWorkflowStore.getState().filterStatus).toBe('pending')
  })

  it('should compute total savings from accepted suggestions only', async () => {
    await useAutoWorkflowStore.getState().addSuggestion(makeSuggestion('1'))
    await useAutoWorkflowStore.getState().addSuggestion(makeSuggestion('2'))
    await useAutoWorkflowStore.getState().acceptSuggestion('1', 'wf-1')
    expect(useAutoWorkflowStore.getState().totalSavings.tokens).toBe(1000)
  })

  it('should detect patterns from repeated prompts', async () => {
    const prompts = [
      '번역해줘', '번역해줘', '번역해줘',
      '요약해줘', '코드 리뷰',
    ]
    useAutoWorkflowStore.getState().detectPatterns(prompts)
    // Wait for async addSuggestion
    await new Promise((r) => setTimeout(r, 50))
    const suggestions = useAutoWorkflowStore.getState().suggestions
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(suggestions[0].pattern).toContain('번역해줘')
    expect(suggestions[0].frequency).toBe(3)
  })

  it('should not detect patterns with fewer than 3 occurrences', () => {
    useAutoWorkflowStore.getState().detectPatterns(['a', 'b', 'c'])
    expect(useAutoWorkflowStore.getState().suggestions).toHaveLength(0)
  })

  it('should not add duplicate patterns', async () => {
    await useAutoWorkflowStore.getState().addSuggestion({
      ...makeSuggestion('existing'),
      pattern: '번역해줘',
    })
    useAutoWorkflowStore.getState().detectPatterns(['번역해줘', '번역해줘', '번역해줘'])
    await new Promise((r) => setTimeout(r, 50))
    expect(useAutoWorkflowStore.getState().suggestions).toHaveLength(1)
  })
})
