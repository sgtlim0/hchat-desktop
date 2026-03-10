import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useConfluenceSearchStore } from '../confluence-search.store'

// Mock dependencies
vi.mock('@/shared/lib/api/atlassian-client', () => ({
  searchConfluence: vi.fn(),
  summarizePage: vi.fn(),
}))

vi.mock('@/shared/lib/api/atlassian-creds-mapper', () => ({
  mapToAtlassianCreds: vi.fn(() => ({
    base_url: 'https://test.atlassian.net',
    username: 'test@example.com',
    api_token: 'test-token',
  })),
  createDefaultBedrockCreds: vi.fn(() => ({
    region: 'us-east-1',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
  })),
}))

vi.mock('@/entities/tool-integration/tool-integration.store', () => ({
  useToolIntegrationStore: {
    getState: vi.fn(() => ({
      confluence: {
        enabled: true,
        baseUrl: 'https://test.atlassian.net',
        username: 'test@example.com',
        apiToken: 'test-token',
      },
    })),
  },
}))

vi.mock('@/shared/types/atlassian', () => ({
  createPageVM: vi.fn((page: any) => ({
    ...page,
    id: page.id || 'test-id',
    title: page.title || 'Test Page',
    url: page.url || 'https://test.atlassian.net/wiki/test',
    space: page.space || 'TEST',
    last_modified: page.last_modified || '2024-01-01',
    author: page.author || 'Test User',
    is_summarizing: false,
  })),
}))

import { searchConfluence, summarizePage } from '@/shared/lib/api/atlassian-client'

describe('ConfluenceSearchStore', () => {
  beforeEach(() => {
    useConfluenceSearchStore.setState({
      pages: [],
      aiOverview: null,
      total: 0,
      loading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const state = useConfluenceSearchStore.getState()
    expect(state.pages).toEqual([])
    expect(state.aiOverview).toBeNull()
    expect(state.total).toBe(0)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should search confluence pages successfully', async () => {
    const mockResults = [
      { id: '1', title: 'Page 1', url: 'url1', space: 'SPACE1' },
      { id: '2', title: 'Page 2', url: 'url2', space: 'SPACE2' },
    ]
    const mockResponse = {
      results: mockResults,
      ai_overview: 'AI generated overview',
      total: 2,
    }

    vi.mocked(searchConfluence).mockResolvedValue(mockResponse)

    const { search } = useConfluenceSearchStore.getState()
    await search('test query', ['SPACE1'], ['123'])

    const state = useConfluenceSearchStore.getState()
    expect(state.pages).toHaveLength(2)
    expect(state.aiOverview).toBe('AI generated overview')
    expect(state.total).toBe(2)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should handle search errors', async () => {
    vi.mocked(searchConfluence).mockRejectedValue(new Error('Search failed'))

    const { search } = useConfluenceSearchStore.getState()
    await search('test query')

    const state = useConfluenceSearchStore.getState()
    expect(state.pages).toEqual([])
    expect(state.error).toBe('Search failed')
    expect(state.loading).toBe(false)
  })

  it('should summarize a page', async () => {
    // Set up initial pages
    useConfluenceSearchStore.setState({
      pages: [
        { id: '1', title: 'Page 1', url: 'url1', space: 'SPACE1', is_summarizing: false } as any,
        { id: '2', title: 'Page 2', url: 'url2', space: 'SPACE2', is_summarizing: false } as any,
      ],
    })

    vi.mocked(summarizePage).mockResolvedValue({
      summary: 'This is a summary of the page',
    })

    const { summarize } = useConfluenceSearchStore.getState()
    await summarize('1')

    const state = useConfluenceSearchStore.getState()
    expect(state.pages[0].ai_summary).toBe('This is a summary of the page')
    expect(state.pages[0].is_summarizing).toBe(false)
  })

  it('should handle summarize errors', async () => {
    useConfluenceSearchStore.setState({
      pages: [{ id: '1', title: 'Page 1', url: 'url1', space: 'SPACE1', is_summarizing: false } as any],
    })

    vi.mocked(summarizePage).mockRejectedValue(new Error('Summarize failed'))

    const { summarize } = useConfluenceSearchStore.getState()
    await summarize('1')

    const state = useConfluenceSearchStore.getState()
    expect(state.pages[0].is_summarizing).toBe(false)
    expect(state.error).toBe('Summarize failed')
  })

  it('should clear results', () => {
    useConfluenceSearchStore.setState({
      pages: [{ id: '1' } as any],
      aiOverview: 'Overview',
      total: 1,
      error: 'Some error',
    })

    const { clearResults } = useConfluenceSearchStore.getState()
    clearResults()

    const state = useConfluenceSearchStore.getState()
    expect(state.pages).toEqual([])
    expect(state.aiOverview).toBeNull()
    expect(state.total).toBe(0)
    expect(state.error).toBeNull()
  })

  it('should set loading state during search', async () => {
    vi.mocked(searchConfluence).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ results: [], ai_overview: null, total: 0 }), 100))
    )

    const { search } = useConfluenceSearchStore.getState()
    const searchPromise = search('test')

    // Check loading state immediately
    expect(useConfluenceSearchStore.getState().loading).toBe(true)

    await searchPromise
    expect(useConfluenceSearchStore.getState().loading).toBe(false)
  })
})