import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCacheStore } from '../cache.store'
import type { CacheEntry } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllCacheEntries: vi.fn(() => Promise.resolve([])),
  putCacheEntry: vi.fn(() => Promise.resolve()),
  deleteCacheEntryFromDb: vi.fn(() => Promise.resolve()),
  clearAllCacheEntries: vi.fn(() => Promise.resolve()),
}))

// Mock crypto.randomUUID — preserve other crypto methods
const _originalCrypto = globalThis.crypto
vi.stubGlobal('crypto', {
  ..._originalCrypto,
  randomUUID: vi.fn(() => `uuid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
})

describe('CacheStore', () => {
  beforeEach(() => {
    useCacheStore.setState({
      entries: [],
      isEnabled: true,
      ttlDays: 7,
      searchQuery: '',
    })
  })

  it('should add a cache entry', () => {
    const { addEntry } = useCacheStore.getState()

    addEntry(
      'hash-123',
      'What is the capital of France?',
      'The capital of France is Paris.',
      'claude-3-5-sonnet',
      500,
      0.025
    )

    const entries = useCacheStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].promptHash).toBe('hash-123')
    expect(entries[0].promptPreview).toBe('What is the capital of France?')
    expect(entries[0].response).toBe('The capital of France is Paris.')
    expect(entries[0].modelId).toBe('claude-3-5-sonnet')
    expect(entries[0].tokensSaved).toBe(500)
    expect(entries[0].costSaved).toBe(0.025)
    expect(entries[0].hitCount).toBe(0)
  })

  it('should delete a cache entry', () => {
    const { addEntry, deleteEntry } = useCacheStore.getState()

    // Add two entries
    addEntry('hash-1', 'Prompt 1', 'Response 1', 'model-1', 100, 0.01)
    addEntry('hash-2', 'Prompt 2', 'Response 2', 'model-2', 200, 0.02)

    const entries = useCacheStore.getState().entries
    const entryToDelete = entries[0].id

    deleteEntry(entryToDelete)

    const remainingEntries = useCacheStore.getState().entries
    expect(remainingEntries).toHaveLength(1)
    expect(remainingEntries[0].promptHash).toBe('hash-1')
  })

  it('should increment hit count', () => {
    const { addEntry, incrementHitCount } = useCacheStore.getState()

    addEntry('hash-123', 'Prompt', 'Response', 'model-1', 100, 0.01)

    const entryId = useCacheStore.getState().entries[0].id

    incrementHitCount(entryId)
    expect(useCacheStore.getState().entries[0].hitCount).toBe(1)

    incrementHitCount(entryId)
    expect(useCacheStore.getState().entries[0].hitCount).toBe(2)
  })

  it('should clear all cache entries', async () => {
    const { addEntry, clearAll } = useCacheStore.getState()

    // Add multiple entries
    addEntry('hash-1', 'Prompt 1', 'Response 1', 'model-1', 100, 0.01)
    addEntry('hash-2', 'Prompt 2', 'Response 2', 'model-2', 200, 0.02)
    addEntry('hash-3', 'Prompt 3', 'Response 3', 'model-3', 300, 0.03)

    expect(useCacheStore.getState().entries).toHaveLength(3)

    clearAll()

    expect(useCacheStore.getState().entries).toHaveLength(0)
  })

  it('should toggle cache enabled state', () => {
    const { toggleEnabled } = useCacheStore.getState()

    expect(useCacheStore.getState().isEnabled).toBe(true)

    toggleEnabled()
    expect(useCacheStore.getState().isEnabled).toBe(false)

    toggleEnabled()
    expect(useCacheStore.getState().isEnabled).toBe(true)
  })

  it('should set TTL days', () => {
    const { setTtlDays } = useCacheStore.getState()

    setTtlDays(30)
    expect(useCacheStore.getState().ttlDays).toBe(30)

    setTtlDays(1)
    expect(useCacheStore.getState().ttlDays).toBe(1)
  })

  it('should calculate total saved tokens and cost', () => {
    const { incrementHitCount, getTotalSaved } = useCacheStore.getState()

    // Use setState with pre-built entries to avoid UUID collision
    const now = new Date().toISOString()
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    useCacheStore.setState({
      entries: [
        { id: 'entry-a', promptHash: 'hash-1', promptPreview: 'Prompt 1', response: 'Response 1', modelId: 'model-1', tokensSaved: 100, costSaved: 0.01, hitCount: 0, createdAt: now, expiresAt: futureDate },
        { id: 'entry-b', promptHash: 'hash-2', promptPreview: 'Prompt 2', response: 'Response 2', modelId: 'model-2', tokensSaved: 200, costSaved: 0.02, hitCount: 0, createdAt: now, expiresAt: futureDate },
      ],
    })

    // Increment hit counts
    incrementHitCount('entry-a')
    incrementHitCount('entry-a') // 2 hits
    incrementHitCount('entry-b') // 1 hit

    const totalSaved = getTotalSaved()

    // Entry 1: 100 tokens * 2 hits = 200, 0.01 cost * 2 hits = 0.02
    // Entry 2: 200 tokens * 1 hit = 200, 0.02 cost * 1 hit = 0.02
    expect(totalSaved.tokens).toBe(400)
    expect(totalSaved.cost).toBeCloseTo(0.04, 5)
  })

  it('should filter entries by search query', () => {
    const { addEntry, setSearchQuery, getFilteredEntries } = useCacheStore.getState()

    addEntry('hash-1', 'What is machine learning?', 'Response 1', 'claude-3-5-sonnet', 100, 0.01)
    addEntry('hash-2', 'Explain quantum physics', 'Response 2', 'gpt-4o', 200, 0.02)
    addEntry('hash-3', 'How does machine work?', 'Response 3', 'claude-3-5-haiku', 150, 0.015)

    setSearchQuery('machine')

    const filtered = getFilteredEntries()
    expect(filtered).toHaveLength(2)
    expect(filtered[0].promptPreview).toContain('machine')
    expect(filtered[1].promptPreview).toContain('machine')
  })

  it('should filter entries by model ID in search', () => {
    const { addEntry, setSearchQuery, getFilteredEntries } = useCacheStore.getState()

    addEntry('hash-1', 'Prompt 1', 'Response 1', 'claude-3-5-sonnet', 100, 0.01)
    addEntry('hash-2', 'Prompt 2', 'Response 2', 'gpt-4o', 200, 0.02)
    addEntry('hash-3', 'Prompt 3', 'Response 3', 'claude-3-5-haiku', 150, 0.015)

    setSearchQuery('claude')

    const filtered = getFilteredEntries()
    expect(filtered).toHaveLength(2)
    expect(filtered.every(e => e.modelId.includes('claude'))).toBe(true)
  })

  it('should hydrate and filter expired entries', async () => {
    const { hydrate } = useCacheStore.getState()

    const now = new Date()
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const mockEntries: CacheEntry[] = [
      {
        id: 'entry-1',
        promptHash: 'hash-1',
        promptPreview: 'Valid entry',
        response: 'Response 1',
        modelId: 'model-1',
        tokensSaved: 100,
        costSaved: 0.01,
        hitCount: 5,
        createdAt: now.toISOString(),
        expiresAt: futureDate, // Valid
      },
      {
        id: 'entry-2',
        promptHash: 'hash-2',
        promptPreview: 'Expired entry',
        response: 'Response 2',
        modelId: 'model-2',
        tokensSaved: 200,
        costSaved: 0.02,
        hitCount: 3,
        createdAt: pastDate,
        expiresAt: pastDate, // Expired
      },
    ]

    const { getAllCacheEntries } = await import('@/shared/lib/db')
    vi.mocked(getAllCacheEntries).mockResolvedValueOnce(mockEntries)

    hydrate()

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10))

    const entries = useCacheStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('entry-1')
  })

  it('should create entry with correct TTL expiration', () => {
    const { addEntry, setTtlDays } = useCacheStore.getState()

    // Set TTL to 30 days
    setTtlDays(30)

    addEntry('hash-123', 'Prompt', 'Response', 'model-1', 100, 0.01)

    const entry = useCacheStore.getState().entries[0]
    const createdAt = new Date(entry.createdAt)
    const expiresAt = new Date(entry.expiresAt)

    const diffInDays = (expiresAt.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
    expect(diffInDays).toBeCloseTo(30, 0)
  })
})