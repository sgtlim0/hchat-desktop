import { create } from 'zustand'
import type { MemoryEntry, MemoryScope } from '@/shared/types'
import { getAllMemories, putMemory, deleteMemoryFromDb } from '@/shared/lib/db'

interface MemoryState {
  entries: MemoryEntry[]
  scope: MemoryScope
  autoExtract: boolean
  searchQuery: string

  hydrate: () => Promise<void>
  setScope: (scope: MemoryScope) => void
  setAutoExtract: (enabled: boolean) => void
  setSearchQuery: (query: string) => void
  addEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntry: (id: string, updates: Partial<Pick<MemoryEntry, 'key' | 'value'>>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  filteredEntries: () => MemoryEntry[]
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: [],
  scope: 'session',
  autoExtract: true,
  searchQuery: '',

  hydrate: async () => {
    const entries = await getAllMemories()
    set({ entries })
  },

  setScope: (scope) => set({ scope }),
  setAutoExtract: (enabled) => set({ autoExtract: enabled }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addEntry: async (entry) => {
    const now = new Date().toISOString()
    const newEntry: MemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    await putMemory(newEntry)
    set((state) => ({ entries: [newEntry, ...state.entries] }))
  },

  updateEntry: async (id, updates) => {
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() }
    await putMemory(updatedEntry)
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? updatedEntry : e
      ),
    }))
  },

  deleteEntry: async (id) => {
    await deleteMemoryFromDb(id)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))
  },

  filteredEntries: () => {
    const { entries, scope, searchQuery } = get()
    return entries
      .filter((e) => e.scope === scope)
      .filter((e) =>
        searchQuery
          ? e.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.value.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
  },
}))
