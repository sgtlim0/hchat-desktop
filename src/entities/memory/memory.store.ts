import { create } from 'zustand'
import type { MemoryEntry, MemoryScope } from '@/shared/types'

interface MemoryState {
  entries: MemoryEntry[]
  scope: MemoryScope
  autoExtract: boolean
  searchQuery: string

  setScope: (scope: MemoryScope) => void
  setAutoExtract: (enabled: boolean) => void
  setSearchQuery: (query: string) => void
  addEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEntry: (id: string, updates: Partial<Pick<MemoryEntry, 'key' | 'value'>>) => void
  deleteEntry: (id: string) => void
  filteredEntries: () => MemoryEntry[]
}

const MOCK_ENTRIES: MemoryEntry[] = [
  {
    id: 'mem-1',
    key: '사용자 선호 언어',
    value: 'TypeScript를 선호하며, 함수형 프로그래밍 패턴을 주로 사용합니다.',
    scope: 'session',
    sessionId: 'session-1',
    source: 'auto',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'mem-2',
    key: '프로젝트 구조',
    value: 'Feature-Sliced Design (FSD) 아키텍처를 사용합니다. src/ 하위에 app, pages, widgets, entities, shared 구조.',
    scope: 'project',
    projectId: 'proj-1',
    source: 'manual',
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mem-3',
    key: 'API 엔드포인트',
    value: 'AWS Bedrock us-east-1 리전을 사용하며, Claude Sonnet 4.6이 기본 모델입니다.',
    scope: 'project',
    projectId: 'proj-1',
    source: 'auto',
    createdAt: '2026-02-27T15:00:00Z',
    updatedAt: '2026-02-27T15:00:00Z',
  },
  {
    id: 'mem-4',
    key: '코딩 스타일',
    value: '불변성 패턴, Zustand 상태관리, Tailwind CSS 스타일링을 사용합니다.',
    scope: 'session',
    sessionId: 'session-2',
    source: 'auto',
    createdAt: '2026-03-02T08:00:00Z',
    updatedAt: '2026-03-02T08:00:00Z',
  },
]

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: MOCK_ENTRIES,
  scope: 'session',
  autoExtract: true,
  searchQuery: '',

  setScope: (scope) => set({ scope }),
  setAutoExtract: (enabled) => set({ autoExtract: enabled }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addEntry: (entry) => {
    const now = new Date().toISOString()
    const newEntry: MemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ entries: [newEntry, ...state.entries] }))
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    }))
  },

  deleteEntry: (id) => {
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
