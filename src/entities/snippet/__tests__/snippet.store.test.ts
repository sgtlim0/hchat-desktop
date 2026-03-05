import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSnippetStore } from '../snippet.store'
import type { CodeSnippet } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllSnippets: vi.fn(() => Promise.resolve([])),
  putSnippet: vi.fn(() => Promise.resolve()),
  deleteSnippetFromDb: vi.fn(() => Promise.resolve()),
}))

describe('SnippetStore', () => {
  beforeEach(() => {
    useSnippetStore.setState({
      snippets: [],
      searchQuery: '',
      selectedLanguage: '',
      selectedSnippetId: null,
    })
  })

  it('should add a snippet', () => {
    const { addSnippet } = useSnippetStore.getState()

    addSnippet('Array Utils', 'javascript', 'const arr = [1,2,3]', 'Utility functions', ['array', 'utils'])

    const snippets = useSnippetStore.getState().snippets
    expect(snippets).toHaveLength(1)
    expect(snippets[0].title).toBe('Array Utils')
    expect(snippets[0].language).toBe('javascript')
    expect(snippets[0].code).toBe('const arr = [1,2,3]')
    expect(snippets[0].description).toBe('Utility functions')
    expect(snippets[0].tags).toEqual(['array', 'utils'])
    expect(snippets[0].isFavorite).toBe(false)
    expect(snippets[0].usageCount).toBe(0)
  })

  it('should update a snippet', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        {
          id: 'snippet-1',
          title: 'Old Title',
          language: 'javascript',
          code: 'old code',
          description: 'old desc',
          tags: [],
          isFavorite: false,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
    })

    const { updateSnippet } = useSnippetStore.getState()
    updateSnippet('snippet-1', { title: 'New Title', code: 'new code' })

    const updated = useSnippetStore.getState().snippets[0]
    expect(updated.title).toBe('New Title')
    expect(updated.code).toBe('new code')
    expect(updated.description).toBe('old desc')
  })

  it('should delete a snippet', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        { id: 'snippet-a', title: 'A', language: 'js', code: 'a', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-b', title: 'B', language: 'ts', code: 'b', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
      ],
      selectedSnippetId: 'snippet-a',
    })

    const { deleteSnippet } = useSnippetStore.getState()
    deleteSnippet('snippet-a')

    const state = useSnippetStore.getState()
    expect(state.snippets).toHaveLength(1)
    expect(state.snippets[0].id).toBe('snippet-b')
    expect(state.selectedSnippetId).toBeNull()
  })

  it('should toggle favorite', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        { id: 'snippet-1', title: 'A', language: 'js', code: 'a', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
      ],
    })

    const { toggleFavorite } = useSnippetStore.getState()

    toggleFavorite('snippet-1')
    expect(useSnippetStore.getState().snippets[0].isFavorite).toBe(true)

    toggleFavorite('snippet-1')
    expect(useSnippetStore.getState().snippets[0].isFavorite).toBe(false)
  })

  it('should increment usage count', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        { id: 'snippet-1', title: 'A', language: 'js', code: 'a', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
      ],
    })

    const { incrementUsage } = useSnippetStore.getState()

    incrementUsage('snippet-1')
    expect(useSnippetStore.getState().snippets[0].usageCount).toBe(1)

    incrementUsage('snippet-1')
    expect(useSnippetStore.getState().snippets[0].usageCount).toBe(2)
  })

  it('should filter by language', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        { id: 'snippet-1', title: 'JS Func', language: 'javascript', code: 'a', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-2', title: 'TS Type', language: 'typescript', code: 'b', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-3', title: 'JS Array', language: 'javascript', code: 'c', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
      ],
      selectedLanguage: 'javascript',
    })

    const filtered = useSnippetStore.getState().getFilteredSnippets()
    expect(filtered).toHaveLength(2)
    expect(filtered.every((s) => s.language === 'javascript')).toBe(true)
  })

  it('should filter by search query', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        { id: 'snippet-1', title: 'Array Utils', language: 'javascript', code: 'a', description: 'array helpers', tags: ['array'], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-2', title: 'Fetch Helper', language: 'typescript', code: 'b', description: 'http fetch', tags: ['http'], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-3', title: 'String Concat', language: 'javascript', code: 'c', description: 'join strings', tags: ['string'], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
      ],
      searchQuery: 'array',
    })

    const filtered = useSnippetStore.getState().getFilteredSnippets()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('Array Utils')
  })

  it('should filter by both language and search query', () => {
    const now = new Date().toISOString()
    useSnippetStore.setState({
      snippets: [
        { id: 'snippet-1', title: 'JS Array', language: 'javascript', code: 'a', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-2', title: 'TS Array', language: 'typescript', code: 'b', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
        { id: 'snippet-3', title: 'JS Fetch', language: 'javascript', code: 'c', description: '', tags: [], isFavorite: false, usageCount: 0, createdAt: now, updatedAt: now },
      ],
      selectedLanguage: 'javascript',
      searchQuery: 'array',
    })

    const filtered = useSnippetStore.getState().getFilteredSnippets()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('snippet-1')
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockSnippets: CodeSnippet[] = [
      { id: 'snippet-1', title: 'From DB', language: 'python', code: 'print("hi")', description: '', tags: [], isFavorite: false, usageCount: 3, createdAt: now, updatedAt: now },
    ]

    const { getAllSnippets } = await import('@/shared/lib/db')
    vi.mocked(getAllSnippets).mockResolvedValueOnce(mockSnippets)

    const { hydrate } = useSnippetStore.getState()
    hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const snippets = useSnippetStore.getState().snippets
    expect(snippets).toHaveLength(1)
    expect(snippets[0].title).toBe('From DB')
  })

  it('should select and deselect a snippet', () => {
    const { selectSnippet } = useSnippetStore.getState()

    selectSnippet('snippet-1')
    expect(useSnippetStore.getState().selectedSnippetId).toBe('snippet-1')

    selectSnippet(null)
    expect(useSnippetStore.getState().selectedSnippetId).toBeNull()
  })
})
