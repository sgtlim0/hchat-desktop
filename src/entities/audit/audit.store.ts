import { create } from 'zustand'
import type { AuditEntry, AuditAction } from '@/shared/types'
import { getAllAuditEntries, putAuditEntry, clearAllAuditEntries } from '@/shared/lib/db'

interface AuditState {
  entries: AuditEntry[]
  filterAction: AuditAction | 'all'
  filterDateRange: { start: string; end: string } | null
  searchQuery: string
  hydrated: boolean

  hydrate: () => Promise<void>
  addEntry: (
    action: AuditAction,
    details: string,
    opts?: {
      modelId?: string
      sessionId?: string
      cost?: number
      metadata?: Record<string, unknown>
    }
  ) => void
  clearAll: () => Promise<void>
  setFilterAction: (action: AuditAction | 'all') => void
  setFilterDateRange: (range: { start: string; end: string } | null) => void
  setSearchQuery: (query: string) => void
  getFilteredEntries: () => AuditEntry[]
  exportAsJson: () => string
  exportAsCsv: () => string
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  filterAction: 'all',
  filterDateRange: null,
  searchQuery: '',
  hydrated: false,

  hydrate: async () => {
    try {
      const entries = await getAllAuditEntries()
      set({ entries, hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate audit store:', error)
      set({ hydrated: true })
    }
  },

  addEntry: (action, details, opts = {}) => {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      action,
      details,
      modelId: opts.modelId,
      sessionId: opts.sessionId,
      cost: opts.cost,
      metadata: opts.metadata,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ entries: [entry, ...state.entries] }))
    putAuditEntry(entry).catch(console.error)
  },

  clearAll: async () => {
    set({ entries: [] })
    await clearAllAuditEntries()
  },

  setFilterAction: (action) => {
    set({ filterAction: action })
  },

  setFilterDateRange: (range) => {
    set({ filterDateRange: range })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  getFilteredEntries: () => {
    const { entries, filterAction, filterDateRange, searchQuery } = get()
    let filtered = entries

    // Filter by action
    if (filterAction !== 'all') {
      filtered = filtered.filter((e) => e.action === filterAction)
    }

    // Filter by date range
    if (filterDateRange) {
      const start = new Date(filterDateRange.start).getTime()
      const end = new Date(filterDateRange.end).getTime() + 86400000 // +1 day
      filtered = filtered.filter((e) => {
        const timestamp = new Date(e.createdAt).getTime()
        return timestamp >= start && timestamp < end
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.details.toLowerCase().includes(query) ||
          e.action.toLowerCase().includes(query) ||
          e.modelId?.toLowerCase().includes(query) ||
          e.sessionId?.toLowerCase().includes(query)
      )
    }

    return filtered
  },

  exportAsJson: () => {
    const filtered = get().getFilteredEntries()
    return JSON.stringify(filtered, null, 2)
  },

  exportAsCsv: () => {
    const filtered = get().getFilteredEntries()
    const headers = ['Timestamp', 'Action', 'Details', 'Model', 'Session', 'Cost']
    const rows = filtered.map((e) => [
      e.createdAt,
      e.action,
      `"${e.details.replace(/"/g, '""')}"`,
      e.modelId || '',
      e.sessionId || '',
      e.cost?.toFixed(4) || '',
    ])

    return [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')
  },
}))
