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
