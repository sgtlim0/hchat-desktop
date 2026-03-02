import { describe, it, expect } from 'vitest'
import { groupByDate, groupByWeek, getLast30Days } from '../usage-chart'
import type { UsageEntry } from '@/shared/types'

function makeEntry(overrides: Partial<UsageEntry> = {}): UsageEntry {
  return {
    id: `usage-${Math.random()}`,
    sessionId: 'session-1',
    modelId: 'claude-sonnet-4.6',
    provider: 'bedrock',
    inputTokens: 100,
    outputTokens: 200,
    cost: 0.001,
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

describe('groupByDate', () => {
  it('returns empty array for empty input', () => {
    const result = groupByDate([])
    expect(result).toEqual([])
  })

  it('groups entries by date', () => {
    const entries = [
      makeEntry({ id: 'u1', createdAt: '2026-03-01T10:00:00Z', cost: 0.01 }),
      makeEntry({ id: 'u2', createdAt: '2026-03-01T14:00:00Z', cost: 0.02 }),
      makeEntry({ id: 'u3', createdAt: '2026-03-02T12:00:00Z', cost: 0.03 }),
    ]

    const result = groupByDate(entries)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      date: '2026-03-01',
      cost: 0.03,
      requests: 2,
    })
    expect(result[1]).toEqual({
      date: '2026-03-02',
      cost: 0.03,
      requests: 1,
    })
  })

  it('sorts results by date ascending', () => {
    const entries = [
      makeEntry({ createdAt: '2026-03-05T12:00:00Z', cost: 0.01 }),
      makeEntry({ createdAt: '2026-03-02T12:00:00Z', cost: 0.02 }),
      makeEntry({ createdAt: '2026-03-08T12:00:00Z', cost: 0.03 }),
    ]

    const result = groupByDate(entries)

    expect(result[0].date).toBe('2026-03-02')
    expect(result[1].date).toBe('2026-03-05')
    expect(result[2].date).toBe('2026-03-08')
  })

  it('accumulates costs and counts per date', () => {
    const entries = [
      makeEntry({ createdAt: '2026-03-01T08:00:00Z', cost: 0.005 }),
      makeEntry({ createdAt: '2026-03-01T12:00:00Z', cost: 0.010 }),
      makeEntry({ createdAt: '2026-03-01T16:00:00Z', cost: 0.015 }),
    ]

    const result = groupByDate(entries)

    expect(result).toHaveLength(1)
    expect(result[0].cost).toBeCloseTo(0.030)
    expect(result[0].requests).toBe(3)
  })

  it('handles entries with zero cost', () => {
    const entries = [
      makeEntry({ createdAt: '2026-03-01T12:00:00Z', cost: 0 }),
      makeEntry({ createdAt: '2026-03-01T14:00:00Z', cost: 0.01 }),
    ]

    const result = groupByDate(entries)

    expect(result).toHaveLength(1)
    expect(result[0].cost).toBeCloseTo(0.01)
    expect(result[0].requests).toBe(2)
  })

  it('extracts date from ISO timestamp correctly', () => {
    const entries = [
      makeEntry({ createdAt: '2026-03-15T23:59:59Z', cost: 0.01 }),
      makeEntry({ createdAt: '2026-03-16T00:00:00Z', cost: 0.02 }),
    ]

    const result = groupByDate(entries)

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2026-03-15')
    expect(result[1].date).toBe('2026-03-16')
  })
})

describe('groupByWeek', () => {
  it('returns empty array for empty input', () => {
    const result = groupByWeek([])
    expect(result).toEqual([])
  })

  it('groups entries by week starting on Sunday', () => {
    const entries = [
      // Week of 2026-03-01 (Sunday)
      makeEntry({ createdAt: '2026-03-01T12:00:00Z', cost: 0.01 }),
      makeEntry({ createdAt: '2026-03-03T12:00:00Z', cost: 0.02 }), // Tuesday
      // Week of 2026-03-08 (Sunday)
      makeEntry({ createdAt: '2026-03-09T12:00:00Z', cost: 0.03 }), // Monday
    ]

    const result = groupByWeek(entries)

    expect(result).toHaveLength(2)
    expect(result[0].weekStart).toBe('2026-03-01')
    expect(result[0].cost).toBeCloseTo(0.03)
    expect(result[0].requests).toBe(2)
    expect(result[1].weekStart).toBe('2026-03-08')
    expect(result[1].cost).toBeCloseTo(0.03)
    expect(result[1].requests).toBe(1)
  })

  it('calculates week start correctly for mid-week dates', () => {
    // 2026-03-04 is Wednesday, should map to Sunday 2026-03-01
    const entries = [makeEntry({ createdAt: '2026-03-04T12:00:00Z', cost: 0.01 })]

    const result = groupByWeek(entries)

    expect(result).toHaveLength(1)
    expect(result[0].weekStart).toBe('2026-03-01')
  })

  it('calculates week start correctly for Saturday', () => {
    // 2026-03-07 is Saturday, should map to Sunday 2026-03-01
    const entries = [makeEntry({ createdAt: '2026-03-07T12:00:00Z', cost: 0.01 })]

    const result = groupByWeek(entries)

    expect(result).toHaveLength(1)
    expect(result[0].weekStart).toBe('2026-03-01')
  })

  it('sorts results by week start ascending', () => {
    const entries = [
      makeEntry({ createdAt: '2026-03-15T12:00:00Z', cost: 0.01 }),
      makeEntry({ createdAt: '2026-03-01T12:00:00Z', cost: 0.02 }),
      makeEntry({ createdAt: '2026-03-22T12:00:00Z', cost: 0.03 }),
    ]

    const result = groupByWeek(entries)

    expect(result[0].weekStart).toBe('2026-03-01')
    expect(result[1].weekStart).toBe('2026-03-15')
    expect(result[2].weekStart).toBe('2026-03-22')
  })

  it('accumulates costs and counts per week', () => {
    // All dates in the same week (Sunday 2026-03-01 to Saturday 2026-03-07)
    const entries = [
      makeEntry({ createdAt: '2026-03-01T12:00:00.000Z', cost: 0.005 }), // Sunday
      makeEntry({ createdAt: '2026-03-03T12:00:00.000Z', cost: 0.010 }), // Tuesday
      makeEntry({ createdAt: '2026-03-05T12:00:00.000Z', cost: 0.015 }), // Thursday
    ]

    const result = groupByWeek(entries)

    expect(result).toHaveLength(1)
    expect(result[0].cost).toBeCloseTo(0.030)
    expect(result[0].requests).toBe(3)
  })
})

describe('getLast30Days', () => {
  it('returns empty array for empty input', () => {
    const result = getLast30Days([])
    expect(result).toEqual([])
  })

  it('filters entries within last 30 days', () => {
    const now = new Date('2026-03-15T12:00:00Z')
    const mockDate = new Date(now)
    const originalDate = global.Date

    // Mock Date to return consistent "now"
    global.Date = class extends originalDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.toISOString())
        } else {
          super(args[0] as string)
        }
      }
    } as typeof Date

    const entries = [
      makeEntry({ id: 'u1', createdAt: '2026-03-14T12:00:00Z' }), // 1 day ago - included
      makeEntry({ id: 'u2', createdAt: '2026-02-20T12:00:00Z' }), // 23 days ago - included
      makeEntry({ id: 'u3', createdAt: '2026-02-10T12:00:00Z' }), // 33 days ago - excluded
      makeEntry({ id: 'u4', createdAt: '2026-03-15T11:00:00Z' }), // today - included
    ]

    const result = getLast30Days(entries)

    global.Date = originalDate

    expect(result).toHaveLength(3)
    expect(result.map((e) => e.id)).toContain('u1')
    expect(result.map((e) => e.id)).toContain('u2')
    expect(result.map((e) => e.id)).toContain('u4')
    expect(result.map((e) => e.id)).not.toContain('u3')
  })

  it('includes entries exactly 30 days old', () => {
    const now = new Date('2026-03-15T12:00:00Z')
    const mockDate = new Date(now)
    const originalDate = global.Date

    global.Date = class extends originalDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.toISOString())
        } else {
          super(args[0] as string)
        }
      }
    } as typeof Date

    const entries = [makeEntry({ createdAt: '2026-02-13T12:00:00Z' })] // exactly 30 days

    const result = getLast30Days(entries)

    global.Date = originalDate

    expect(result).toHaveLength(1)
  })

  it('excludes entries older than 30 days', () => {
    const now = new Date('2026-03-15T12:00:00Z')
    const mockDate = new Date(now)
    const originalDate = global.Date

    global.Date = class extends originalDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.toISOString())
        } else {
          super(args[0] as string)
        }
      }
    } as typeof Date

    const entries = [makeEntry({ createdAt: '2026-02-13T11:59:59Z' })] // slightly more than 30 days

    const result = getLast30Days(entries)

    global.Date = originalDate

    expect(result).toHaveLength(0)
  })

  it('returns all entries if all are within 30 days', () => {
    const now = new Date('2026-03-15T12:00:00Z')
    const mockDate = new Date(now)
    const originalDate = global.Date

    global.Date = class extends originalDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.toISOString())
        } else {
          super(args[0] as string)
        }
      }
    } as typeof Date

    const entries = [
      makeEntry({ createdAt: '2026-03-14T12:00:00Z' }),
      makeEntry({ createdAt: '2026-03-10T12:00:00Z' }),
      makeEntry({ createdAt: '2026-03-05T12:00:00Z' }),
    ]

    const result = getLast30Days(entries)

    global.Date = originalDate

    expect(result).toHaveLength(3)
  })
})
