import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePairProgrammingStore } from '../pair-programming.store'
import type { PairSession, AiSuggestion } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllPairSessions: vi.fn(() => Promise.resolve([])),
  putPairSession: vi.fn(() => Promise.resolve()),
  deletePairSessionFromDb: vi.fn(() => Promise.resolve()),
}))

describe('PairProgrammingStore', () => {
  beforeEach(() => {
    usePairProgrammingStore.setState({
      sessions: [],
      selectedSessionId: null,
    })
  })

  it('should create a session', () => {
    const { createSession } = usePairProgrammingStore.getState()

    createSession('My Pair Session', 'typescript')

    const sessions = usePairProgrammingStore.getState().sessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].title).toBe('My Pair Session')
    expect(sessions[0].language).toBe('typescript')
    expect(sessions[0].code).toBe('')
    expect(sessions[0].aiSuggestions).toEqual([])
  })

  it('should delete a session', () => {
    const now = new Date().toISOString()
    usePairProgrammingStore.setState({
      sessions: [
        { id: 'ps-1', title: 'A', language: 'js', code: '', aiSuggestions: [], createdAt: now, updatedAt: now },
        { id: 'ps-2', title: 'B', language: 'ts', code: '', aiSuggestions: [], createdAt: now, updatedAt: now },
      ],
      selectedSessionId: 'ps-1',
    })

    usePairProgrammingStore.getState().deleteSession('ps-1')

    const state = usePairProgrammingStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].id).toBe('ps-2')
    expect(state.selectedSessionId).toBeNull()
  })

  it('should update code', () => {
    const now = new Date().toISOString()
    usePairProgrammingStore.setState({
      sessions: [
        { id: 'ps-1', title: 'A', language: 'js', code: '', aiSuggestions: [], createdAt: now, updatedAt: now },
      ],
    })

    usePairProgrammingStore.getState().updateCode('ps-1', 'const x = 42')

    const session = usePairProgrammingStore.getState().sessions[0]
    expect(session.code).toBe('const x = 42')
  })

  it('should add a suggestion', () => {
    const now = new Date().toISOString()
    usePairProgrammingStore.setState({
      sessions: [
        { id: 'ps-1', title: 'A', language: 'js', code: 'let x = 1', aiSuggestions: [], createdAt: now, updatedAt: now },
      ],
    })

    const suggestion: AiSuggestion = {
      id: 'sg-1',
      line: 1,
      type: 'fix',
      original: 'let x = 1',
      suggestion: 'const x = 1',
      accepted: false,
    }

    usePairProgrammingStore.getState().addSuggestion('ps-1', suggestion)

    const session = usePairProgrammingStore.getState().sessions[0]
    expect(session.aiSuggestions).toHaveLength(1)
    expect(session.aiSuggestions[0].suggestion).toBe('const x = 1')
    expect(session.aiSuggestions[0].accepted).toBe(false)
  })

  it('should accept a suggestion', () => {
    const now = new Date().toISOString()
    const suggestion: AiSuggestion = {
      id: 'sg-1',
      line: 1,
      type: 'refactor',
      original: 'var x = 1',
      suggestion: 'const x = 1',
      accepted: false,
    }
    usePairProgrammingStore.setState({
      sessions: [
        { id: 'ps-1', title: 'A', language: 'js', code: 'var x = 1', aiSuggestions: [suggestion], createdAt: now, updatedAt: now },
      ],
    })

    usePairProgrammingStore.getState().acceptSuggestion('ps-1', 'sg-1')

    const session = usePairProgrammingStore.getState().sessions[0]
    expect(session.aiSuggestions[0].accepted).toBe(true)
  })

  it('should select and deselect a session', () => {
    const { selectSession } = usePairProgrammingStore.getState()

    selectSession('ps-1')
    expect(usePairProgrammingStore.getState().selectedSessionId).toBe('ps-1')

    selectSession(null)
    expect(usePairProgrammingStore.getState().selectedSessionId).toBeNull()
  })

  it('should not clear selectedSessionId when deleting a different session', () => {
    const now = new Date().toISOString()
    usePairProgrammingStore.setState({
      sessions: [
        { id: 'ps-1', title: 'A', language: 'js', code: '', aiSuggestions: [], createdAt: now, updatedAt: now },
        { id: 'ps-2', title: 'B', language: 'ts', code: '', aiSuggestions: [], createdAt: now, updatedAt: now },
      ],
      selectedSessionId: 'ps-2',
    })

    usePairProgrammingStore.getState().deleteSession('ps-1')

    expect(usePairProgrammingStore.getState().selectedSessionId).toBe('ps-2')
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockSessions: PairSession[] = [
      { id: 'ps-1', title: 'From DB', language: 'python', code: 'print(1)', aiSuggestions: [], createdAt: now, updatedAt: now },
    ]

    const { getAllPairSessions } = await import('@/shared/lib/db')
    vi.mocked(getAllPairSessions).mockResolvedValueOnce(mockSessions)

    usePairProgrammingStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const sessions = usePairProgrammingStore.getState().sessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].title).toBe('From DB')
  })
})
