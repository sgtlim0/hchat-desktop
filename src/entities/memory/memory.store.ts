import { create } from 'zustand'
import type { MemoryEntry, MemoryScope, AwsCredentials } from '@/shared/types'
import { getAllMemories, putMemory, deleteMemoryFromDb } from '@/shared/lib/db'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface ExtractedMemory {
  key: string
  value: string
  scope: string
}

interface ChatMessage {
  role: string
  content: string
}

interface MemoryState {
  entries: MemoryEntry[]
  scope: MemoryScope
  autoExtract: boolean
  isExtracting: boolean
  searchQuery: string

  hydrate: () => Promise<void>
  setScope: (scope: MemoryScope) => void
  setAutoExtract: (enabled: boolean) => void
  setSearchQuery: (query: string) => void
  addEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntry: (id: string, updates: Partial<Pick<MemoryEntry, 'key' | 'value'>>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  extractFromMessages: (messages: ChatMessage[], credentials: AwsCredentials) => Promise<void>
  filteredEntries: () => MemoryEntry[]
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: [],
  scope: 'session',
  autoExtract: true,
  isExtracting: false,
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

  extractFromMessages: async (messages, credentials) => {
    if (get().isExtracting || messages.length < 2) return

    set({ isExtracting: true })
    try {
      const response = await fetch(`${API_BASE}/api/extract-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, credentials }),
      })

      if (!response.ok) {
        throw new Error(`Memory extraction failed: HTTP ${response.status}`)
      }

      const data: { memories: ExtractedMemory[]; error?: string } = await response.json()

      if (data.error) {
        console.error('Memory extraction error:', data.error)
        return
      }

      const now = new Date().toISOString()
      const existingKeys = new Set(get().entries.map((e) => e.key.toLowerCase()))

      for (const mem of data.memories) {
        // Skip duplicates by key
        if (existingKeys.has(mem.key.toLowerCase())) continue

        const newEntry: MemoryEntry = {
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          key: mem.key,
          value: mem.value,
          scope: mem.scope === 'global' ? 'project' : 'session',
          source: 'auto',
          createdAt: now,
          updatedAt: now,
        }

        await putMemory(newEntry)
        set((state) => ({ entries: [newEntry, ...state.entries] }))
        existingKeys.add(mem.key.toLowerCase())
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Memory extraction failed'
      console.error('extractFromMessages error:', msg)
    } finally {
      set({ isExtracting: false })
    }
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
