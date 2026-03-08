import { create } from 'zustand'

interface SearchResult {
  type: 'confluence' | 'jira'
  title: string
  url: string
  excerpt: string
  key?: string       // Jira issue key
  space?: string     // Confluence space
  status?: string    // Jira status
  assignee?: string  // Jira assignee
  updated?: string
}

interface InternalSearchState {
  query: string
  targets: ('confluence' | 'jira')[]
  results: SearchResult[]
  summary: string
  isSearching: boolean

  setQuery: (query: string) => void
  setTargets: (targets: ('confluence' | 'jira')[]) => void
  toggleTarget: (target: 'confluence' | 'jira') => void
  addResults: (results: SearchResult[]) => void
  setSummary: (summary: string) => void
  setSearching: (searching: boolean) => void
  clearResults: () => void
  clearAll: () => void
}

export const useInternalSearchStore = create<InternalSearchState>((set) => ({
  query: '',
  targets: ['confluence', 'jira'],
  results: [],
  summary: '',
  isSearching: false,

  setQuery: (query) => set({ query }),

  setTargets: (targets) => set({ targets }),

  toggleTarget: (target) => set((state) => ({
    targets: state.targets.includes(target)
      ? state.targets.filter(t => t !== target)
      : [...state.targets, target]
  })),

  addResults: (results) => set((state) => ({
    results: [...state.results, ...results]
  })),

  setSummary: (summary) => set({ summary }),

  setSearching: (searching) => set({ isSearching: searching }),

  clearResults: () => set({ results: [] }),

  clearAll: () => set({
    query: '',
    targets: ['confluence', 'jira'],
    results: [],
    summary: '',
    isSearching: false
  })
}))