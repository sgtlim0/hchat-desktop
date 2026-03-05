import { create } from 'zustand'
import type { RegexPattern } from '@/shared/types'
import { getAllRegexPatterns, putRegexPattern, deleteRegexPatternFromDb } from '@/shared/lib/db'

interface RegexMatch {
  text: string
  index: number
  groups?: Record<string, string>
}

interface RegexBuilderState {
  patterns: RegexPattern[]
  currentPattern: string
  currentFlags: string
  testInput: string
  selectedPatternId: string | null

  setPattern: (pattern: string) => void
  setFlags: (flags: string) => void
  setTestInput: (input: string) => void
  savePattern: (name: string) => void
  updatePattern: (id: string, updates: Partial<Pick<RegexPattern, 'name' | 'pattern' | 'flags' | 'description' | 'testInput'>>) => void
  deletePattern: (id: string) => void
  selectPattern: (id: string | null) => void
  toggleFavorite: (id: string) => void
  getMatches: () => RegexMatch[]
  hydrate: () => void
}

export const useRegexBuilderStore = create<RegexBuilderState>((set, get) => ({
  patterns: [],
  currentPattern: '',
  currentFlags: 'g',
  testInput: '',
  selectedPatternId: null,

  setPattern: (pattern) => {
    set({ currentPattern: pattern })
  },

  setFlags: (flags) => {
    set({ currentFlags: flags })
  },

  setTestInput: (input) => {
    set({ testInput: input })
  },

  savePattern: (name) => {
    const { currentPattern, currentFlags, testInput } = get()
    const now = new Date().toISOString()
    const pattern: RegexPattern = {
      id: `regex-${Date.now()}`,
      name,
      pattern: currentPattern,
      flags: currentFlags,
      description: '',
      testInput,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      patterns: [pattern, ...state.patterns],
    }))

    putRegexPattern(pattern).catch(() => {})
  },

  updatePattern: (id, updates) => {
    const now = new Date().toISOString()
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: now } : p
      ),
    }))

    const updated = get().patterns.find((p) => p.id === id)
    if (updated) {
      putRegexPattern(updated).catch(() => {})
    }
  },

  deletePattern: (id) => {
    set((state) => ({
      patterns: state.patterns.filter((p) => p.id !== id),
      selectedPatternId: state.selectedPatternId === id ? null : state.selectedPatternId,
    }))

    deleteRegexPatternFromDb(id).catch(() => {})
  },

  selectPattern: (id) => {
    if (id === null) {
      set({ selectedPatternId: null })
      return
    }

    const pattern = get().patterns.find((p) => p.id === id)
    if (pattern) {
      set({
        selectedPatternId: id,
        currentPattern: pattern.pattern,
        currentFlags: pattern.flags,
        testInput: pattern.testInput,
      })
    }
  },

  toggleFavorite: (id) => {
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() } : p
      ),
    }))

    const updated = get().patterns.find((p) => p.id === id)
    if (updated) {
      putRegexPattern(updated).catch(() => {})
    }
  },

  getMatches: () => {
    const { currentPattern, currentFlags, testInput } = get()
    if (!currentPattern || !testInput) return []

    try {
      const regex = new RegExp(currentPattern, currentFlags)
      const matches: RegexMatch[] = []

      if (currentFlags.includes('g')) {
        let match: RegExpExecArray | null
        while ((match = regex.exec(testInput)) !== null) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.groups ? { ...match.groups } : undefined,
          })
          if (!match[0]) {
            regex.lastIndex++
          }
        }
      } else {
        const match = regex.exec(testInput)
        if (match) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.groups ? { ...match.groups } : undefined,
          })
        }
      }

      return matches
    } catch {
      return []
    }
  },

  hydrate: () => {
    getAllRegexPatterns()
      .then((patterns) => set({ patterns }))
      .catch(() => {})
  },
}))
