import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCodeReviewStore } from '../code-review.store'

vi.mock('@/shared/lib/db', () => ({
  getAllCodeReviewSessions: vi.fn().mockResolvedValue([]),
  putCodeReviewSession: vi.fn().mockResolvedValue(undefined),
  deleteCodeReviewSessionFromDb: vi.fn().mockResolvedValue(undefined),
}))

const makeComment = (id: string) => ({
  id, line: 10, severity: 'warning' as const, category: 'security' as const,
  message: 'Potential XSS', suggestion: 'Use sanitize()',
})

describe('CodeReviewStore', () => {
  beforeEach(() => { useCodeReviewStore.setState({ sessions: [], selectedSessionId: null }) })

  it('should have empty initial state', () => {
    expect(useCodeReviewStore.getState().sessions).toEqual([])
  })

  it('should create a session', async () => {
    const id = await useCodeReviewStore.getState().createSession('Review #1', 'typescript', 'const x = 1')
    expect(id).toBeTruthy()
    const session = useCodeReviewStore.getState().sessions[0]
    expect(session.title).toBe('Review #1')
    expect(session.status).toBe('pending')
    expect(session.comments).toEqual([])
  })

  it('should add a comment', async () => {
    const sid = await useCodeReviewStore.getState().createSession('Test', 'ts', 'code')
    await useCodeReviewStore.getState().addComment(sid, makeComment('c1'))
    const session = useCodeReviewStore.getState().sessions[0]
    expect(session.comments).toHaveLength(1)
    expect(session.status).toBe('reviewed')
  })

  it('should remove a comment', async () => {
    const sid = await useCodeReviewStore.getState().createSession('Test', 'ts', 'code')
    await useCodeReviewStore.getState().addComment(sid, makeComment('c1'))
    await useCodeReviewStore.getState().removeComment(sid, 'c1')
    expect(useCodeReviewStore.getState().sessions[0].comments).toHaveLength(0)
  })

  it('should mark as resolved', async () => {
    const sid = await useCodeReviewStore.getState().createSession('Test', 'ts', 'code')
    await useCodeReviewStore.getState().markResolved(sid)
    expect(useCodeReviewStore.getState().sessions[0].status).toBe('resolved')
  })

  it('should delete a session', async () => {
    const sid = await useCodeReviewStore.getState().createSession('Test', 'ts', 'code')
    await useCodeReviewStore.getState().deleteSession(sid)
    expect(useCodeReviewStore.getState().sessions).toHaveLength(0)
  })

  it('should clear selectedSessionId on delete', async () => {
    const sid = await useCodeReviewStore.getState().createSession('Test', 'ts', 'code')
    useCodeReviewStore.getState().setSelectedSessionId(sid)
    await useCodeReviewStore.getState().deleteSession(sid)
    expect(useCodeReviewStore.getState().selectedSessionId).toBeNull()
  })
})
