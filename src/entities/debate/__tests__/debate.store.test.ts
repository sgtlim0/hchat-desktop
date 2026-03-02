import { describe, it, expect, beforeEach } from 'vitest'
import { useDebateStore } from '../debate.store'
import type { DebateRound, GroupChatResponse } from '@/shared/types'

function resetStore() {
  useDebateStore.setState({ session: null, isRunning: false })
}

function makeResponse(overrides: Partial<GroupChatResponse> = {}): GroupChatResponse {
  return {
    modelId: 'claude-sonnet-4.6',
    provider: 'bedrock',
    content: 'Test response',
    isStreaming: false,
    ...overrides,
  }
}

function makeRound(overrides: Partial<DebateRound> = {}): DebateRound {
  return {
    roundNumber: 1,
    responses: [makeResponse()],
    ...overrides,
  }
}

describe('useDebateStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with null session and not running', () => {
    const { session, isRunning } = useDebateStore.getState()
    expect(session).toBeNull()
    expect(isRunning).toBe(false)
  })

  describe('startDebate', () => {
    it('creates a new session with given topic and models', () => {
      const topic = 'Is AI beneficial for society?'
      const models = ['claude-sonnet-4.6', 'gpt-4.7']

      useDebateStore.getState().startDebate(topic, models)

      const { session, isRunning } = useDebateStore.getState()
      expect(session).not.toBeNull()
      expect(session?.topic).toBe(topic)
      expect(session?.models).toEqual(models)
      expect(session?.rounds).toEqual([])
      expect(session?.summary).toBe('')
      expect(session?.status).toBe('debating')
      expect(isRunning).toBe(true)
    })

    it('generates unique session ID', () => {
      vi.spyOn(Date, 'now').mockReturnValueOnce(1000)
      useDebateStore.getState().startDebate('Topic 1', ['model-a'])
      const session1 = useDebateStore.getState().session

      resetStore()

      vi.spyOn(Date, 'now').mockReturnValueOnce(2000)
      useDebateStore.getState().startDebate('Topic 2', ['model-b'])
      const session2 = useDebateStore.getState().session

      expect(session1?.id).not.toBe(session2?.id)
      vi.restoreAllMocks()
    })

    it('sets createdAt timestamp', () => {
      useDebateStore.getState().startDebate('Topic', ['model'])
      const { session } = useDebateStore.getState()

      expect(session?.createdAt).toBeDefined()
      expect(new Date(session?.createdAt!).getTime()).toBeGreaterThan(0)
    })
  })

  describe('addRound', () => {
    beforeEach(() => {
      useDebateStore.getState().startDebate('Test Topic', ['model-a', 'model-b'])
    })

    it('appends round to session', () => {
      const round1 = makeRound({ roundNumber: 1 })
      const round2 = makeRound({ roundNumber: 2 })

      useDebateStore.getState().addRound(round1)
      useDebateStore.getState().addRound(round2)

      const { session } = useDebateStore.getState()
      expect(session?.rounds).toHaveLength(2)
      expect(session?.rounds[0].roundNumber).toBe(1)
      expect(session?.rounds[1].roundNumber).toBe(2)
    })

    it('does nothing if no session', () => {
      resetStore()
      const round = makeRound()

      useDebateStore.getState().addRound(round)

      const { session } = useDebateStore.getState()
      expect(session).toBeNull()
    })

    it('preserves existing rounds', () => {
      const round1 = makeRound({ roundNumber: 1 })
      useDebateStore.getState().addRound(round1)

      const round2 = makeRound({ roundNumber: 2 })
      useDebateStore.getState().addRound(round2)

      const { session } = useDebateStore.getState()
      expect(session?.rounds).toHaveLength(2)
      expect(session?.rounds[0]).toEqual(round1)
    })
  })

  describe('updateRoundResponse', () => {
    beforeEach(() => {
      useDebateStore.getState().startDebate('Test Topic', ['model-a', 'model-b'])
      const round = makeRound({
        roundNumber: 1,
        responses: [
          makeResponse({ modelId: 'model-a', content: 'Original A' }),
          makeResponse({ modelId: 'model-b', content: 'Original B' }),
        ],
      })
      useDebateStore.getState().addRound(round)
    })

    it('updates specific model response in round', () => {
      useDebateStore.getState().updateRoundResponse(1, 'model-a', (resp) => ({
        ...resp,
        content: 'Updated A',
      }))

      const { session } = useDebateStore.getState()
      const round = session?.rounds.find((r) => r.roundNumber === 1)
      const respA = round?.responses.find((r) => r.modelId === 'model-a')
      const respB = round?.responses.find((r) => r.modelId === 'model-b')

      expect(respA?.content).toBe('Updated A')
      expect(respB?.content).toBe('Original B')
    })

    it('does nothing if no session', () => {
      resetStore()
      useDebateStore.getState().updateRoundResponse(1, 'model-a', (resp) => ({
        ...resp,
        content: 'Should not update',
      }))

      const { session } = useDebateStore.getState()
      expect(session).toBeNull()
    })

    it('does nothing if round not found', () => {
      useDebateStore.getState().updateRoundResponse(999, 'model-a', (resp) => ({
        ...resp,
        content: 'Updated',
      }))

      const { session } = useDebateStore.getState()
      const round = session?.rounds[0]
      expect(round?.responses[0].content).toBe('Original A')
    })

    it('does nothing if model not found in round', () => {
      useDebateStore.getState().updateRoundResponse(1, 'nonexistent-model', (resp) => ({
        ...resp,
        content: 'Updated',
      }))

      const { session } = useDebateStore.getState()
      const round = session?.rounds[0]
      expect(round?.responses[0].content).toBe('Original A')
    })

    it('updates streaming state', () => {
      useDebateStore.getState().updateRoundResponse(1, 'model-a', (resp) => ({
        ...resp,
        isStreaming: true,
        content: resp.content + ' streaming...',
      }))

      const { session } = useDebateStore.getState()
      const round = session?.rounds[0]
      const respA = round?.responses.find((r) => r.modelId === 'model-a')

      expect(respA?.isStreaming).toBe(true)
      expect(respA?.content).toBe('Original A streaming...')
    })
  })

  describe('setStatus', () => {
    beforeEach(() => {
      useDebateStore.getState().startDebate('Test Topic', ['model-a'])
    })

    it('updates session status and isRunning for debating', () => {
      useDebateStore.getState().setStatus('debating')

      const { session, isRunning } = useDebateStore.getState()
      expect(session?.status).toBe('debating')
      expect(isRunning).toBe(true)
    })

    it('updates session status and isRunning for summarizing', () => {
      useDebateStore.getState().setStatus('summarizing')

      const { session, isRunning } = useDebateStore.getState()
      expect(session?.status).toBe('summarizing')
      expect(isRunning).toBe(true)
    })

    it('updates session status and sets isRunning to false for done', () => {
      useDebateStore.getState().setStatus('done')

      const { session, isRunning } = useDebateStore.getState()
      expect(session?.status).toBe('done')
      expect(isRunning).toBe(false)
    })

    it('updates session status and sets isRunning to false for setup', () => {
      useDebateStore.getState().setStatus('setup')

      const { session, isRunning } = useDebateStore.getState()
      expect(session?.status).toBe('setup')
      expect(isRunning).toBe(false)
    })

    it('does nothing if no session', () => {
      resetStore()
      useDebateStore.getState().setStatus('debating')

      const { session } = useDebateStore.getState()
      expect(session).toBeNull()
    })
  })

  describe('setSummary', () => {
    beforeEach(() => {
      useDebateStore.getState().startDebate('Test Topic', ['model-a'])
    })

    it('sets summary, status to done, and isRunning to false', () => {
      const summary = 'This is the debate summary.'

      useDebateStore.getState().setSummary(summary)

      const { session, isRunning } = useDebateStore.getState()
      expect(session?.summary).toBe(summary)
      expect(session?.status).toBe('done')
      expect(isRunning).toBe(false)
    })

    it('does nothing if no session', () => {
      resetStore()
      useDebateStore.getState().setSummary('Should not set')

      const { session } = useDebateStore.getState()
      expect(session).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears session and sets isRunning to false', () => {
      useDebateStore.getState().startDebate('Test Topic', ['model-a'])
      expect(useDebateStore.getState().session).not.toBeNull()
      expect(useDebateStore.getState().isRunning).toBe(true)

      useDebateStore.getState().reset()

      const { session, isRunning } = useDebateStore.getState()
      expect(session).toBeNull()
      expect(isRunning).toBe(false)
    })

    it('can be called when already empty', () => {
      expect(useDebateStore.getState().session).toBeNull()

      useDebateStore.getState().reset()

      const { session, isRunning } = useDebateStore.getState()
      expect(session).toBeNull()
      expect(isRunning).toBe(false)
    })
  })
})
