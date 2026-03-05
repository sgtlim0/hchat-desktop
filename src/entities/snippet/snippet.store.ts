import { create } from 'zustand'
import type { CodeSnippet } from '@/shared/types'
import { getAllSnippets, putSnippet, deleteSnippetFromDb } from '@/shared/lib/db'

interface SnippetState {
  snippets: CodeSnippet[]
  searchQuery: string
  selectedLanguage: string
  selectedSnippetId: string | null

  hydrate: () => void
  addSnippet: (title: string, language: string, code: string, description: string, tags: string[]) => void
  updateSnippet: (id: string, updates: Partial<Pick<CodeSnippet, 'title' | 'language' | 'code' | 'description' | 'tags'>>) => void
  deleteSnippet: (id: string) => void
  setSearchQuery: (query: string) => void
  setLanguage: (language: string) => void
  selectSnippet: (id: string | null) => void
  incrementUsage: (id: string) => void
  toggleFavorite: (id: string) => void
  getFilteredSnippets: () => CodeSnippet[]
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  searchQuery: '',
  selectedLanguage: '',
  selectedSnippetId: null,

  hydrate: () => {
    getAllSnippets()
      .then((snippets) => {
        set({ snippets })
      })
      .catch(console.error)
  },

  addSnippet: (title, language, code, description, tags) => {
    const now = new Date().toISOString()
    const snippet: CodeSnippet = {
      id: `snippet-${Date.now()}`,
      title,
      language,
      code,
      description,
      tags,
      isFavorite: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      snippets: [snippet, ...state.snippets],
    }))

    putSnippet(snippet).catch(console.error)
  },

  updateSnippet: (id, updates) => {
    set((state) => ({
      snippets: state.snippets.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, ...updates, updatedAt: new Date().toISOString() }
        putSnippet(updated).catch(console.error)
        return updated
      }),
    }))
  },

  deleteSnippet: (id) => {
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id),
      selectedSnippetId: state.selectedSnippetId === id ? null : state.selectedSnippetId,
    }))

    deleteSnippetFromDb(id).catch(console.error)
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setLanguage: (language) => {
    set({ selectedLanguage: language })
  },

  selectSnippet: (id) => {
    set({ selectedSnippetId: id })
  },

  incrementUsage: (id) => {
    set((state) => ({
      snippets: state.snippets.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, usageCount: s.usageCount + 1, updatedAt: new Date().toISOString() }
        putSnippet(updated).catch(console.error)
        return updated
      }),
    }))
  },

  toggleFavorite: (id) => {
    set((state) => ({
      snippets: state.snippets.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, isFavorite: !s.isFavorite, updatedAt: new Date().toISOString() }
        putSnippet(updated).catch(console.error)
        return updated
      }),
    }))
  },

  getFilteredSnippets: () => {
    const { snippets, searchQuery, selectedLanguage } = get()

    return snippets.filter((s) => {
      if (selectedLanguage && s.language !== selectedLanguage) return false
      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase()
      return (
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    })
  },
}))
