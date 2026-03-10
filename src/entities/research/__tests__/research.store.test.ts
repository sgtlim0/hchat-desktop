import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResearchStore } from '../research.store'
import type { ResearchSession } from '../research.store'

// Mock settings store
vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
      selectedModel: 'claude-3-5-haiku',
    })),
  },
}))

vi.mock('@/shared/constants', () => ({
  BEDROCK_MODEL_MAP: {
    'claude-3-5-haiku': 'anthropic.claude-3-5-haiku-20241022-v1:0',
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe('ResearchStore', () => {
  beforeEach(() => {
    useResearchStore.setState({
      sessions: [],
      currentSessionId: null,
      isResearching: false,
    })
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const state = useResearchStore.getState()
    expect(state.sessions).toEqual([])
    expect(state.currentSessionId).toBeNull()
    expect(state.isResearching).toBe(false)
  })

  it('should start research and create session', async () => {
    const mockResponse = {
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"research_queries","queries":["query1","query2"]}\n\n'))
          controller.enqueue(new TextEncoder().encode('data: {"type":"done"}\n\n'))
          controller.close()
        },
      }),
    }

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

    const { startResearch } = useResearchStore.getState()
    await startResearch('test research query', 2, 10)

    const state = useResearchStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].query).toBe('test research query')
    expect(state.sessions[0].status).toBe('done')
    expect(state.sessions[0].queries).toEqual(['query1', 'query2'])
    expect(state.isResearching).toBe(false)
  })

  it('should handle research with sources and report', async () => {
    const mockResponse = {
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"type":"research_evidence","sources":[{"url":"http://example.com","title":"Example","score":0.95}]}\n\n'
            )
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"research_report","content":"This is the research report"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: {"type":"done"}\n\n'))
          controller.close()
        },
      }),
    }

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

    const { startResearch } = useResearchStore.getState()
    await startResearch('test query')

    const state = useResearchStore.getState()
    expect(state.sessions[0].sources).toHaveLength(1)
    expect(state.sessions[0].sources[0].url).toBe('http://example.com')
    expect(state.sessions[0].report).toBe('This is the research report')
  })

  it('should handle research errors', async () => {
    const mockResponse = {
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"error","error":"Research failed"}\n\n'))
          controller.close()
        },
      }),
    }

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

    const { startResearch } = useResearchStore.getState()
    await startResearch('test query')

    const state = useResearchStore.getState()
    expect(state.sessions[0].status).toBe('error')
    expect(state.sessions[0].error).toBe('Research failed')
    expect(state.isResearching).toBe(false)
  })

  it('should handle HTTP errors', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const { startResearch } = useResearchStore.getState()
    await startResearch('test query')

    const state = useResearchStore.getState()
    expect(state.sessions[0].status).toBe('error')
    expect(state.sessions[0].error).toBe('HTTP 500')
    expect(state.isResearching).toBe(false)
  })

  it('should cancel research', () => {
    useResearchStore.setState({
      sessions: [
        {
          id: 'research-123',
          query: 'test',
          status: 'running',
          queries: [],
          sources: [],
          report: '',
          createdAt: new Date().toISOString(),
        },
      ],
      currentSessionId: 'research-123',
      isResearching: true,
    })

    const { cancelResearch } = useResearchStore.getState()
    cancelResearch()

    const state = useResearchStore.getState()
    expect(state.sessions[0].status).toBe('idle')
    expect(state.isResearching).toBe(false)
  })

  it('should clear a specific session', () => {
    const sessions: ResearchSession[] = [
      {
        id: 'session-1',
        query: 'query 1',
        status: 'done',
        queries: [],
        sources: [],
        report: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'session-2',
        query: 'query 2',
        status: 'done',
        queries: [],
        sources: [],
        report: '',
        createdAt: new Date().toISOString(),
      },
    ]

    useResearchStore.setState({
      sessions,
      currentSessionId: 'session-1',
    })

    const { clearSession } = useResearchStore.getState()
    clearSession('session-1')

    const state = useResearchStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].id).toBe('session-2')
    expect(state.currentSessionId).toBeNull()
  })

  it('should clear all sessions', () => {
    const sessions: ResearchSession[] = [
      {
        id: 'session-1',
        query: 'query 1',
        status: 'done',
        queries: [],
        sources: [],
        report: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'session-2',
        query: 'query 2',
        status: 'done',
        queries: [],
        sources: [],
        report: '',
        createdAt: new Date().toISOString(),
      },
    ]

    useResearchStore.setState({
      sessions,
      currentSessionId: 'session-1',
      isResearching: true,
    })

    const { clearAll } = useResearchStore.getState()
    clearAll()

    const state = useResearchStore.getState()
    expect(state.sessions).toEqual([])
    expect(state.currentSessionId).toBeNull()
    expect(state.isResearching).toBe(false)
  })

  it('should not start research without credentials', async () => {
    vi.mocked((await import('@/entities/settings/settings.store')).useSettingsStore.getState).mockReturnValue({
      credentials: null,
      selectedModel: 'claude-3-5-haiku',
    } as any)

    const { startResearch } = useResearchStore.getState()
    await startResearch('test query')

    const state = useResearchStore.getState()
    expect(state.sessions).toEqual([])
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  })
})