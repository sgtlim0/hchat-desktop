import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLiveTranslateStore } from '../live-translate.store'
import type { LiveTranslateSession, TranslateUtterance } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllLiveTranslateSessions: vi.fn(() => Promise.resolve([])),
  putLiveTranslateSession: vi.fn(() => Promise.resolve()),
  deleteLiveTranslateSessionFromDb: vi.fn(() => Promise.resolve()),
}))

const makeSession = (overrides: Partial<LiveTranslateSession> = {}): LiveTranslateSession => ({
  id: 'lt-1',
  title: 'Meeting',
  sourceLang: 'ko',
  targetLang: 'en',
  transcripts: [],
  isActive: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('LiveTranslateStore', () => {
  beforeEach(() => {
    useLiveTranslateStore.setState({
      sessions: [],
      selectedSessionId: null,
    })
  })

  it('should create a session', () => {
    const { createSession } = useLiveTranslateStore.getState()
    createSession('Meeting', 'ko', 'en')

    const sessions = useLiveTranslateStore.getState().sessions
    expect(sessions).toHaveLength(1)
    expect(sessions[0].title).toBe('Meeting')
    expect(sessions[0].sourceLang).toBe('ko')
    expect(sessions[0].targetLang).toBe('en')
    expect(sessions[0].transcripts).toEqual([])
    expect(sessions[0].isActive).toBe(false)
  })

  it('should delete a session', () => {
    useLiveTranslateStore.setState({
      sessions: [makeSession({ id: 'lt-1' }), makeSession({ id: 'lt-2', title: 'Call' })],
      selectedSessionId: 'lt-1',
    })

    useLiveTranslateStore.getState().deleteSession('lt-1')

    const state = useLiveTranslateStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].id).toBe('lt-2')
    expect(state.selectedSessionId).toBeNull()
  })

  it('should not clear selectedSessionId when deleting a different session', () => {
    useLiveTranslateStore.setState({
      sessions: [makeSession({ id: 'lt-1' }), makeSession({ id: 'lt-2' })],
      selectedSessionId: 'lt-1',
    })

    useLiveTranslateStore.getState().deleteSession('lt-2')

    expect(useLiveTranslateStore.getState().selectedSessionId).toBe('lt-1')
  })

  it('should add an utterance to a session', () => {
    useLiveTranslateStore.setState({ sessions: [makeSession({ id: 'lt-1' })] })

    const utterance: TranslateUtterance = {
      id: 'u-1',
      speaker: 'local',
      original: '안녕하세요',
      translated: 'Hello',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    }

    useLiveTranslateStore.getState().addUtterance('lt-1', utterance)

    const session = useLiveTranslateStore.getState().sessions[0]
    expect(session.transcripts).toHaveLength(1)
    expect(session.transcripts[0].original).toBe('안녕하세요')
    expect(session.transcripts[0].translated).toBe('Hello')
  })

  it('should not modify other sessions when adding utterance', () => {
    useLiveTranslateStore.setState({
      sessions: [makeSession({ id: 'lt-1' }), makeSession({ id: 'lt-2' })],
    })

    const utterance: TranslateUtterance = {
      id: 'u-1',
      speaker: 'remote',
      original: 'Hi',
      translated: '안녕',
      confidence: 0.9,
      timestamp: new Date().toISOString(),
    }

    useLiveTranslateStore.getState().addUtterance('lt-1', utterance)

    expect(useLiveTranslateStore.getState().sessions[1].transcripts).toEqual([])
  })

  it('should toggle active state', () => {
    useLiveTranslateStore.setState({ sessions: [makeSession({ id: 'lt-1', isActive: false })] })

    useLiveTranslateStore.getState().toggleActive('lt-1')
    expect(useLiveTranslateStore.getState().sessions[0].isActive).toBe(true)

    useLiveTranslateStore.getState().toggleActive('lt-1')
    expect(useLiveTranslateStore.getState().sessions[0].isActive).toBe(false)
  })

  it('should select and deselect a session', () => {
    useLiveTranslateStore.getState().selectSession('lt-1')
    expect(useLiveTranslateStore.getState().selectedSessionId).toBe('lt-1')

    useLiveTranslateStore.getState().selectSession(null)
    expect(useLiveTranslateStore.getState().selectedSessionId).toBeNull()
  })

  it('should hydrate sessions from db', async () => {
    const { getAllLiveTranslateSessions } = await import('@/shared/lib/db')
    const mockSessions = [makeSession({ id: 'lt-db-1' })]
    vi.mocked(getAllLiveTranslateSessions).mockResolvedValueOnce(mockSessions)

    useLiveTranslateStore.getState().hydrate()
    await vi.waitFor(() => {
      expect(useLiveTranslateStore.getState().sessions).toHaveLength(1)
      expect(useLiveTranslateStore.getState().sessions[0].id).toBe('lt-db-1')
    })
  })
})
