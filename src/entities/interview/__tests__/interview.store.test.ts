import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useInterviewStore } from '../interview.store'
vi.mock('@/shared/lib/db', () => ({ getAllInterviewSessions: vi.fn().mockResolvedValue([]), putInterviewSession: vi.fn().mockResolvedValue(undefined), deleteInterviewSessionFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('InterviewStore', () => {
  beforeEach(() => { useInterviewStore.setState({ sessions: [], selectedSessionId: null }) })
  it('should create session', () => { useInterviewStore.getState().createSession('FE', 'Frontend Dev', [{ id: 'q1', type: 'technical', question: 'What is React?' }]); expect(useInterviewStore.getState().sessions).toHaveLength(1) })
  it('should answer question', () => { useInterviewStore.getState().createSession('T', 'Dev', [{ id: 'q1', type: 'behavioral', question: 'Tell me about yourself' }]); const id = useInterviewStore.getState().sessions[0].id; useInterviewStore.getState().answerQuestion(id, 'q1', 'I am a developer'); expect(useInterviewStore.getState().sessions[0].questions[0].userAnswer).toBe('I am a developer') })
  it('should delete session', () => { useInterviewStore.getState().createSession('T', 'D', []); useInterviewStore.getState().deleteSession(useInterviewStore.getState().sessions[0].id); expect(useInterviewStore.getState().sessions).toHaveLength(0) })
})
