import { create } from 'zustand'
import type { CacheEntry } from '@/shared/types'
import { getAllCacheEntries, putCacheEntry, deleteCacheEntryFromDb, clearAllCacheEntries } from '@/shared/lib/db'

interface CacheState {
  entries: CacheEntry[]
  isEnabled: boolean
  ttlDays: number
  searchQuery: string

  hydrate: () => void
  addEntry: (promptHash: string, promptPreview: string, response: string, modelId: string, tokensSaved: number, costSaved: number) => void
  deleteEntry: (id: string) => void
  incrementHitCount: (id: string) => void
  clearAll: () => void
  toggleEnabled: () => void
  setTtlDays: (days: number) => void
  setSearchQuery: (query: string) => void
  getTotalSaved: () => { tokens: number; cost: number }
  getFilteredEntries: () => CacheEntry[]
}

export const useCacheStore = create<CacheState>((set, get) => ({
  entries: [],
  isEnabled: true,
  ttlDays: 7,
  searchQuery: '',

  hydrate: () => {
    getAllCacheEntries()
      .then((entries) => {
        // Filter out expired entries
        const now = new Date().toISOString()
        const validEntries = entries.filter((e) => e.expiresAt > now)
        set({ entries: validEntries })
      })
      .catch(console.error)
  },

  addEntry: (promptHash, promptPreview, response, modelId, tokensSaved, costSaved) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + get().ttlDays * 24 * 60 * 60 * 1000).toISOString()

    const entry: CacheEntry = {
      id: crypto.randomUUID(),
      promptHash,
      promptPreview,
      response,
      modelId,
      tokensSaved,
      costSaved,
      hitCount: 0,
      createdAt: now.toISOString(),
      expiresAt,
    }

    set((state) => ({
      entries: [entry, ...state.entries],
    }))

    putCacheEntry(entry).catch(console.error)
  },

  deleteEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))

    deleteCacheEntryFromDb(id).catch(console.error)
  },

  incrementHitCount: (id) => {
    set((state) => ({
      entries: state.entries.map((e) => {
        if (e.id !== id) return e
        const updated = { ...e, hitCount: e.hitCount + 1 }
        putCacheEntry(updated).catch(console.error)
        return updated
      }),
    }))
  },

  clearAll: () => {
    set({ entries: [] })
    clearAllCacheEntries().catch(console.error)
  },

  toggleEnabled: () => {
    set((state) => ({ isEnabled: !state.isEnabled }))
  },

  setTtlDays: (days) => {
    set({ ttlDays: days })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  getTotalSaved: () => {
    const entries = get().entries
    return {
      tokens: entries.reduce((sum, e) => sum + e.tokensSaved * e.hitCount, 0),
      cost: entries.reduce((sum, e) => sum + e.costSaved * e.hitCount, 0),
    }
  },

  getFilteredEntries: () => {
    const { entries, searchQuery } = get()
    if (!searchQuery.trim()) return entries

    const query = searchQuery.toLowerCase()
    return entries.filter((e) =>
      e.promptPreview.toLowerCase().includes(query) ||
      e.modelId.toLowerCase().includes(query)
    )
  },
}))
