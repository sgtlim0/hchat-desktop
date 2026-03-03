import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUsageStore, calculateCost } from '../usage.store'
import type { UsageEntry } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  putUsage: vi.fn().mockResolvedValue(undefined),
  getAllUsages: vi.fn().mockResolvedValue([]),
  clearAllUsages: vi.fn().mockResolvedValue(undefined),
}))

function makeEntry(overrides: Partial<UsageEntry> = {}): UsageEntry {
  return {
    id: `usage-${Date.now()}`,
    sessionId: 'session-1',
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    provider: 'bedrock',
    inputTokens: 100,
    outputTokens: 200,
    cost: 0.0012,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function resetStore() {
  useUsageStore.setState({ entries: [], hydrated: false })
}

describe('useUsageStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with empty entries', () => {
    const { entries, hydrated } = useUsageStore.getState()
    expect(entries).toEqual([])
    expect(hydrated).toBe(false)
  })

  it('addUsage prepends entry', () => {
    const entry1 = makeEntry({ id: 'u1' })
    const entry2 = makeEntry({ id: 'u2' })

    useUsageStore.getState().addUsage(entry1)
    useUsageStore.getState().addUsage(entry2)

    const { entries } = useUsageStore.getState()
    expect(entries).toHaveLength(2)
    expect(entries[0].id).toBe('u2')
    expect(entries[1].id).toBe('u1')
  })

  it('getSessionUsage filters by sessionId', () => {
    useUsageStore.getState().addUsage(makeEntry({ id: 'u1', sessionId: 's1' }))
    useUsageStore.getState().addUsage(makeEntry({ id: 'u2', sessionId: 's2' }))
    useUsageStore.getState().addUsage(makeEntry({ id: 'u3', sessionId: 's1' }))

    const result = useUsageStore.getState().getSessionUsage('s1')
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.sessionId === 's1')).toBe(true)
  })

  it('getModelUsage filters by modelId', () => {
    useUsageStore.getState().addUsage(makeEntry({ id: 'u1', modelId: 'model-a' }))
    useUsageStore.getState().addUsage(makeEntry({ id: 'u2', modelId: 'model-b' }))

    const result = useUsageStore.getState().getModelUsage('model-a')
    expect(result).toHaveLength(1)
    expect(result[0].modelId).toBe('model-a')
  })

  it('getTotalCost sums all costs', () => {
    useUsageStore.getState().addUsage(makeEntry({ id: 'u1', cost: 0.01 }))
    useUsageStore.getState().addUsage(makeEntry({ id: 'u2', cost: 0.02 }))

    const total = useUsageStore.getState().getTotalCost()
    expect(total).toBeCloseTo(0.03)
  })

  it('clearAll empties entries', async () => {
    useUsageStore.getState().addUsage(makeEntry({ id: 'u1' }))
    expect(useUsageStore.getState().entries).toHaveLength(1)

    await useUsageStore.getState().clearAll()
    expect(useUsageStore.getState().entries).toEqual([])
  })
})

describe('calculateCost', () => {
  it('calculates cost for a known model', () => {
    const cost = calculateCost('claude-sonnet-4.6', 1000, 500)
    expect(cost).toBeGreaterThan(0)
  })

  it('returns 0 for unknown model', () => {
    expect(calculateCost('unknown-model', 1000, 500)).toBe(0)
  })

  it('returns 0 for zero tokens', () => {
    expect(calculateCost('claude-sonnet-4.6', 0, 0)).toBe(0)
  })
})

describe('category tracking', () => {
  beforeEach(() => {
    resetStore()
  })

  it('getCategoryUsage filters by category', () => {
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u1',
      category: 'chat',
      cost: 0.01,
      inputTokens: 100,
      outputTokens: 50,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u2',
      category: 'translate',
      cost: 0.02,
      inputTokens: 200,
      outputTokens: 100,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u3',
      category: 'chat',
      cost: 0.015,
      inputTokens: 150,
      outputTokens: 75,
    }))

    const chatUsage = useUsageStore.getState().getCategoryUsage('chat')
    const translateUsage = useUsageStore.getState().getCategoryUsage('translate')

    expect(chatUsage).toHaveLength(2)
    expect(chatUsage.every((e) => e.category === 'chat')).toBe(true)
    expect(translateUsage).toHaveLength(1)
    expect(translateUsage[0].category).toBe('translate')
  })

  it('getCategoryUsage defaults to chat for entries without category', () => {
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u1',
      category: 'chat',
      cost: 0.01,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u2',
      // no category
      cost: 0.02,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u3',
      category: 'translate',
      cost: 0.015,
    }))

    const chatUsage = useUsageStore.getState().getCategoryUsage('chat')
    expect(chatUsage).toHaveLength(2)
    expect(chatUsage.some((e) => e.id === 'u1')).toBe(true)
    expect(chatUsage.some((e) => e.id === 'u2')).toBe(true)
  })

  it('getCategoryCost returns total cost for category', () => {
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u1',
      category: 'chat',
      cost: 0.01,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u2',
      category: 'translate',
      cost: 0.02,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u3',
      category: 'chat',
      cost: 0.015,
    }))

    const chatCost = useUsageStore.getState().getCategoryCost('chat')
    const translateCost = useUsageStore.getState().getCategoryCost('translate')

    expect(chatCost).toBeCloseTo(0.025)
    expect(translateCost).toBeCloseTo(0.02)
  })

  it('getCategoryCost includes entries without category as chat', () => {
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u1',
      category: 'chat',
      cost: 0.01,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u2',
      // no category
      cost: 0.02,
    }))

    const chatCost = useUsageStore.getState().getCategoryCost('chat')
    expect(chatCost).toBeCloseTo(0.03)
  })

  it('getCategorySummary returns summary for all 6 categories', () => {
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u1',
      category: 'chat',
      inputTokens: 100,
      outputTokens: 50,
      cost: 0.01,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u2',
      category: 'translate',
      inputTokens: 200,
      outputTokens: 100,
      cost: 0.02,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u3',
      category: 'chat',
      inputTokens: 150,
      outputTokens: 75,
      cost: 0.015,
    }))
    useUsageStore.getState().addUsage(makeEntry({
      id: 'u4',
      // no category (defaults to chat)
      inputTokens: 50,
      outputTokens: 25,
      cost: 0.005,
    }))

    const summary = useUsageStore.getState().getCategorySummary()

    expect(summary).toHaveLength(6)

    const chatSummary = summary.find((s) => s.category === 'chat')
    expect(chatSummary).toBeDefined()
    expect(chatSummary!.totalEntries).toBe(3)
    expect(chatSummary!.totalInputTokens).toBe(300)
    expect(chatSummary!.totalOutputTokens).toBe(150)
    expect(chatSummary!.totalCost).toBeCloseTo(0.03)

    const translateSummary = summary.find((s) => s.category === 'translate')
    expect(translateSummary).toBeDefined()
    expect(translateSummary!.totalEntries).toBe(1)
    expect(translateSummary!.totalInputTokens).toBe(200)
    expect(translateSummary!.totalOutputTokens).toBe(100)
    expect(translateSummary!.totalCost).toBeCloseTo(0.02)

    const emptyCategories = summary.filter((s) =>
      !['chat', 'translate'].includes(s.category)
    )
    emptyCategories.forEach((cat) => {
      expect(cat.totalEntries).toBe(0)
      expect(cat.totalInputTokens).toBe(0)
      expect(cat.totalOutputTokens).toBe(0)
      expect(cat.totalCost).toBe(0)
    })
  })

  it('getCategorySummary includes all 6 categories', () => {
    const summary = useUsageStore.getState().getCategorySummary()
    const categories = summary.map((s) => s.category)

    expect(categories).toContain('chat')
    expect(categories).toContain('translate')
    expect(categories).toContain('doc-write')
    expect(categories).toContain('ocr')
    expect(categories).toContain('image-gen')
    expect(categories).toContain('data-analysis')
  })
})
