import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useJiraSearchStore } from '../jira-search.store'

// Mock dependencies
vi.mock('@/shared/lib/api/atlassian-client', () => ({
  searchJira: vi.fn(),
  analyzeTicket: vi.fn(),
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
  createTicketVM: vi.fn((ticket: any) => ({
    ...ticket,
    key: ticket.key || 'TEST-1',
    summary: ticket.summary || 'Test Ticket',
    status: ticket.status || 'Open',
    priority: ticket.priority || 'High',
    assignee: ticket.assignee || 'Test User',
    created: ticket.created || '2024-01-01',
    is_analyzing: false,
  })),
}))

import { searchJira, analyzeTicket } from '@/shared/lib/api/atlassian-client'

describe('JiraSearchStore', () => {
  beforeEach(() => {
    useJiraSearchStore.setState({
      tickets: [],
      aiOverview: null,
      total: 0,
      loading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const state = useJiraSearchStore.getState()
    expect(state.tickets).toEqual([])
    expect(state.aiOverview).toBeNull()
    expect(state.total).toBe(0)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should search jira tickets successfully', async () => {
    const mockResults = [
      { key: 'TEST-1', summary: 'Bug in login', status: 'Open' },
      { key: 'TEST-2', summary: 'Feature request', status: 'In Progress' },
    ]
    const mockResponse = {
      results: mockResults,
      ai_overview: 'AI analysis of tickets',
      total: 2,
    }

    vi.mocked(searchJira).mockResolvedValue(mockResponse)

    const { search } = useJiraSearchStore.getState()
    await search('bug', ['PROJ1'], ['TEST-1'])

    const state = useJiraSearchStore.getState()
    expect(state.tickets).toHaveLength(2)
    expect(state.aiOverview).toBe('AI analysis of tickets')
    expect(state.total).toBe(2)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should handle search errors', async () => {
    vi.mocked(searchJira).mockRejectedValue(new Error('Jira API error'))

    const { search } = useJiraSearchStore.getState()
    await search('test query')

    const state = useJiraSearchStore.getState()
    expect(state.tickets).toEqual([])
    expect(state.error).toBe('Jira API error')
    expect(state.loading).toBe(false)
  })

  it('should analyze a ticket', async () => {
    // Set up initial tickets
    useJiraSearchStore.setState({
      tickets: [
        { key: 'TEST-1', summary: 'Bug', is_analyzing: false } as any,
        { key: 'TEST-2', summary: 'Feature', is_analyzing: false } as any,
      ],
    })

    vi.mocked(analyzeTicket).mockResolvedValue({
      ai_analysis: 'This is a critical bug that needs immediate attention',
      total_comments: 5,
    })

    const { analyze } = useJiraSearchStore.getState()
    await analyze('TEST-1')

    const state = useJiraSearchStore.getState()
    expect(state.tickets[0].ai_analysis).toBe('This is a critical bug that needs immediate attention')
    expect(state.tickets[0].total_comments).toBe(5)
    expect(state.tickets[0].is_analyzing).toBe(false)
  })

  it('should handle analyze errors', async () => {
    useJiraSearchStore.setState({
      tickets: [{ key: 'TEST-1', summary: 'Bug', is_analyzing: false } as any],
    })

    vi.mocked(analyzeTicket).mockRejectedValue(new Error('Analysis failed'))

    const { analyze } = useJiraSearchStore.getState()
    await analyze('TEST-1')

    const state = useJiraSearchStore.getState()
    expect(state.tickets[0].is_analyzing).toBe(false)
    expect(state.error).toBe('Analysis failed')
  })

  it('should clear results', () => {
    useJiraSearchStore.setState({
      tickets: [{ key: 'TEST-1' } as any],
      aiOverview: 'Overview',
      total: 1,
      error: 'Some error',
    })

    const { clearResults } = useJiraSearchStore.getState()
    clearResults()

    const state = useJiraSearchStore.getState()
    expect(state.tickets).toEqual([])
    expect(state.aiOverview).toBeNull()
    expect(state.total).toBe(0)
    expect(state.error).toBeNull()
  })

  it('should set loading state during search', async () => {
    vi.mocked(searchJira).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ results: [], ai_overview: null, total: 0 }), 100))
    )

    const { search } = useJiraSearchStore.getState()
    const searchPromise = search('test')

    // Check loading state immediately
    expect(useJiraSearchStore.getState().loading).toBe(true)

    await searchPromise
    expect(useJiraSearchStore.getState().loading).toBe(false)
  })

  it('should update analyzing state during ticket analysis', async () => {
    useJiraSearchStore.setState({
      tickets: [{ key: 'TEST-1', summary: 'Bug', is_analyzing: false } as any],
    })

    vi.mocked(analyzeTicket).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ai_analysis: 'Analysis', total_comments: 3 }), 100))
    )

    const { analyze } = useJiraSearchStore.getState()
    const analyzePromise = analyze('TEST-1')

    // Check analyzing state is set to true
    expect(useJiraSearchStore.getState().tickets[0].is_analyzing).toBe(true)

    await analyzePromise
    expect(useJiraSearchStore.getState().tickets[0].is_analyzing).toBe(false)
  })
})