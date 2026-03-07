import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMultiAgentDebateStore } from '../multi-agent-debate.store'
import type { MultiAgentDebateSession, DebateRound } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllMultiAgentDebates: vi.fn(() => Promise.resolve([])),
  putMultiAgentDebate: vi.fn(() => Promise.resolve()),
  deleteMultiAgentDebateFromDb: vi.fn(() => Promise.resolve()),
}))

describe('MultiAgentDebateStore', () => {
  beforeEach(() => {
    useMultiAgentDebateStore.setState({
      debates: [],
      selectedDebateId: null,
    })
  })

  it('should create a debate', () => {
    useMultiAgentDebateStore.getState().createDebate('AI Ethics', 3)

    const debates = useMultiAgentDebateStore.getState().debates
    expect(debates).toHaveLength(1)
    expect(debates[0].topic).toBe('AI Ethics')
    expect(debates[0].maxRounds).toBe(3)
    expect(debates[0].status).toBe('setup')
    expect(debates[0].agents).toEqual([])
    expect(debates[0].rounds).toEqual([])
  })

  it('should delete a debate', () => {
    const now = new Date().toISOString()
    useMultiAgentDebateStore.setState({
      debates: [
        { id: 'mad-1', topic: 'A', agents: [], rounds: [], status: 'setup', maxRounds: 3, createdAt: now },
        { id: 'mad-2', topic: 'B', agents: [], rounds: [], status: 'setup', maxRounds: 5, createdAt: now },
      ],
      selectedDebateId: 'mad-1',
    })

    useMultiAgentDebateStore.getState().deleteDebate('mad-1')

    const state = useMultiAgentDebateStore.getState()
    expect(state.debates).toHaveLength(1)
    expect(state.debates[0].id).toBe('mad-2')
    expect(state.selectedDebateId).toBeNull()
  })

  it('should add an agent', () => {
    const now = new Date().toISOString()
    useMultiAgentDebateStore.setState({
      debates: [
        { id: 'mad-1', topic: 'A', agents: [], rounds: [], status: 'setup', maxRounds: 3, createdAt: now },
      ],
    })

    useMultiAgentDebateStore.getState().addAgent('mad-1', 'Claude', 'proponent', 'claude-3-opus')

    const debate = useMultiAgentDebateStore.getState().debates[0]
    expect(debate.agents).toHaveLength(1)
    expect(debate.agents[0].name).toBe('Claude')
    expect(debate.agents[0].role).toBe('proponent')
    expect(debate.agents[0].modelId).toBe('claude-3-opus')
  })

  it('should add a round', () => {
    const now = new Date().toISOString()
    useMultiAgentDebateStore.setState({
      debates: [
        { id: 'mad-1', topic: 'A', agents: [{ id: 'ag-1', name: 'Claude', role: 'proponent', modelId: 'claude' }], rounds: [], status: 'running', maxRounds: 3, createdAt: now },
      ],
    })

    const round: DebateRound = {
      id: 'r-1',
      roundNumber: 1,
      agentId: 'ag-1',
      content: 'AI should be regulated.',
      votes: 0,
      timestamp: now,
    }

    useMultiAgentDebateStore.getState().addRound('mad-1', round)

    const debate = useMultiAgentDebateStore.getState().debates[0]
    expect(debate.rounds).toHaveLength(1)
    expect(debate.rounds[0].content).toBe('AI should be regulated.')
  })

  it('should vote on a round', () => {
    const now = new Date().toISOString()
    useMultiAgentDebateStore.setState({
      debates: [{
        id: 'mad-1',
        topic: 'A',
        agents: [],
        rounds: [{ id: 'r-1', roundNumber: 1, agentId: 'ag-1', content: 'test', votes: 0, timestamp: now }],
        status: 'voting',
        maxRounds: 3,
        createdAt: now,
      }],
    })

    useMultiAgentDebateStore.getState().voteRound('mad-1', 'r-1')
    expect(useMultiAgentDebateStore.getState().debates[0].rounds[0].votes).toBe(1)

    useMultiAgentDebateStore.getState().voteRound('mad-1', 'r-1')
    expect(useMultiAgentDebateStore.getState().debates[0].rounds[0].votes).toBe(2)
  })

  it('should set consensus', () => {
    const now = new Date().toISOString()
    useMultiAgentDebateStore.setState({
      debates: [
        { id: 'mad-1', topic: 'A', agents: [], rounds: [], status: 'running', maxRounds: 3, createdAt: now },
      ],
    })

    useMultiAgentDebateStore.getState().setConsensus('mad-1', 'All agents agree on balanced regulation.')

    expect(useMultiAgentDebateStore.getState().debates[0].consensus).toBe('All agents agree on balanced regulation.')
  })

  it('should start and complete a debate', () => {
    const now = new Date().toISOString()
    useMultiAgentDebateStore.setState({
      debates: [
        { id: 'mad-1', topic: 'A', agents: [], rounds: [], status: 'setup', maxRounds: 3, createdAt: now },
      ],
    })

    useMultiAgentDebateStore.getState().startDebate('mad-1')
    expect(useMultiAgentDebateStore.getState().debates[0].status).toBe('running')

    useMultiAgentDebateStore.getState().completeDebate('mad-1')
    expect(useMultiAgentDebateStore.getState().debates[0].status).toBe('completed')
  })

  it('should select and deselect a debate', () => {
    useMultiAgentDebateStore.getState().selectDebate('mad-1')
    expect(useMultiAgentDebateStore.getState().selectedDebateId).toBe('mad-1')

    useMultiAgentDebateStore.getState().selectDebate(null)
    expect(useMultiAgentDebateStore.getState().selectedDebateId).toBeNull()
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockDebates: MultiAgentDebateSession[] = [
      { id: 'mad-1', topic: 'From DB', agents: [], rounds: [], status: 'setup', maxRounds: 5, createdAt: now },
    ]

    const { getAllMultiAgentDebates } = await import('@/shared/lib/db')
    vi.mocked(getAllMultiAgentDebates).mockResolvedValueOnce(mockDebates)

    useMultiAgentDebateStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const debates = useMultiAgentDebateStore.getState().debates
    expect(debates).toHaveLength(1)
    expect(debates[0].topic).toBe('From DB')
  })
})
