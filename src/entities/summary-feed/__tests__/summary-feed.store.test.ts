import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSummaryFeedStore } from '../summary-feed.store'
import type { FeedEntry } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllFeedEntries: vi.fn(() => Promise.resolve([])),
  putFeedEntry: vi.fn(() => Promise.resolve()),
  deleteFeedEntryFromDb: vi.fn(() => Promise.resolve()),
}))

describe('SummaryFeedStore', () => {
  beforeEach(() => {
    useSummaryFeedStore.setState({
      entries: [],
    })
  })

  it('should add a feed entry', () => {
    const { addEntry } = useSummaryFeedStore.getState()

    addEntry('daily', 'Today you had 5 conversations', ['High usage of code models', 'Mostly TypeScript'], 5)

    const entries = useSummaryFeedStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].period).toBe('daily')
    expect(entries[0].summary).toBe('Today you had 5 conversations')
    expect(entries[0].insights).toEqual(['High usage of code models', 'Mostly TypeScript'])
    expect(entries[0].sessionCount).toBe(5)
  })

  it('should remove a feed entry', () => {
    useSummaryFeedStore.setState({
      entries: [
        { id: 'e-1', period: 'daily', summary: 'A', insights: [], sessionCount: 1, createdAt: new Date().toISOString() },
        { id: 'e-2', period: 'weekly', summary: 'B', insights: [], sessionCount: 3, createdAt: new Date().toISOString() },
      ],
    })

    const { removeEntry } = useSummaryFeedStore.getState()
    removeEntry('e-1')

    const entries = useSummaryFeedStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('e-2')
  })

  it('should clear old entries by days threshold', () => {
    const recent = new Date().toISOString()
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

    useSummaryFeedStore.setState({
      entries: [
        { id: 'e-new', period: 'daily', summary: 'Recent', insights: [], sessionCount: 1, createdAt: recent },
        { id: 'e-old', period: 'weekly', summary: 'Old', insights: [], sessionCount: 2, createdAt: old },
      ],
    })

    const { clearOldEntries } = useSummaryFeedStore.getState()
    clearOldEntries(7)

    const entries = useSummaryFeedStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('e-new')
  })

  it('should hydrate from DB', async () => {
    const mockEntries: FeedEntry[] = [
      { id: 'e-1', period: 'daily', summary: 'From DB', insights: ['insight'], sessionCount: 2, createdAt: new Date().toISOString() },
    ]

    const { getAllFeedEntries } = await import('@/shared/lib/db')
    vi.mocked(getAllFeedEntries).mockResolvedValueOnce(mockEntries)

    const { hydrate } = useSummaryFeedStore.getState()
    hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const entries = useSummaryFeedStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].summary).toBe('From DB')
  })

  it('should prepend new entries', () => {
    const { addEntry } = useSummaryFeedStore.getState()

    addEntry('daily', 'First', [], 1)
    addEntry('weekly', 'Second', [], 2)

    const entries = useSummaryFeedStore.getState().entries
    expect(entries).toHaveLength(2)
    expect(entries[0].summary).toBe('Second')
    expect(entries[1].summary).toBe('First')
  })

  it('should keep all entries when none are old enough', () => {
    const recent = new Date().toISOString()

    useSummaryFeedStore.setState({
      entries: [
        { id: 'e-1', period: 'daily', summary: 'A', insights: [], sessionCount: 1, createdAt: recent },
        { id: 'e-2', period: 'daily', summary: 'B', insights: [], sessionCount: 2, createdAt: recent },
      ],
    })

    const { clearOldEntries } = useSummaryFeedStore.getState()
    clearOldEntries(30)

    expect(useSummaryFeedStore.getState().entries).toHaveLength(2)
  })
})
