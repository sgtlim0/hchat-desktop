import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAutonomousAgentStore } from '../autonomous-agent.store'

vi.mock('@/shared/lib/db', () => ({
  getAllAgentRuns: vi.fn().mockResolvedValue([]),
  putAgentRun: vi.fn().mockResolvedValue(undefined),
  deleteAgentRunFromDb: vi.fn().mockResolvedValue(undefined),
}))

const makeStep = (id: string, type: 'think' | 'tool_call' = 'think') => ({
  id, type, content: `Step ${id}`, status: 'done' as const, timestamp: '2026-01-01T00:00:00Z',
})

describe('AutonomousAgentStore', () => {
  beforeEach(() => {
    useAutonomousAgentStore.setState({
      runs: [], currentRunId: null, maxSteps: 10, requireApproval: true,
    })
  })

  it('should have empty initial state', () => {
    const s = useAutonomousAgentStore.getState()
    expect(s.runs).toEqual([])
    expect(s.currentRunId).toBeNull()
    expect(s.maxSteps).toBe(10)
    expect(s.requireApproval).toBe(true)
  })

  it('should start a run', async () => {
    const id = await useAutonomousAgentStore.getState().startRun('Summarize article', 'claude-sonnet')
    expect(id).toBeTruthy()
    expect(useAutonomousAgentStore.getState().runs).toHaveLength(1)
    expect(useAutonomousAgentStore.getState().runs[0].goal).toBe('Summarize article')
    expect(useAutonomousAgentStore.getState().runs[0].status).toBe('running')
    expect(useAutonomousAgentStore.getState().currentRunId).toBe(id)
  })

  it('should add steps to a run', async () => {
    const runId = await useAutonomousAgentStore.getState().startRun('Test', 'model')
    await useAutonomousAgentStore.getState().addStep(runId, makeStep('s1', 'think'))
    await useAutonomousAgentStore.getState().addStep(runId, makeStep('s2', 'tool_call'))
    const run = useAutonomousAgentStore.getState().runs[0]
    expect(run.steps).toHaveLength(2)
  })

  it('should update step status', async () => {
    const runId = await useAutonomousAgentStore.getState().startRun('Test', 'model')
    await useAutonomousAgentStore.getState().addStep(runId, { ...makeStep('s1', 'tool_call'), status: 'running' })
    await useAutonomousAgentStore.getState().updateStepStatus(runId, 's1', 'done', 'result data')
    const step = useAutonomousAgentStore.getState().runs[0].steps[0]
    expect(step.status).toBe('done')
    expect(step.toolResult).toBe('result data')
  })

  it('should complete a run', async () => {
    const runId = await useAutonomousAgentStore.getState().startRun('Test', 'model')
    await useAutonomousAgentStore.getState().completeRun(runId, 'completed')
    expect(useAutonomousAgentStore.getState().runs[0].status).toBe('completed')
    expect(useAutonomousAgentStore.getState().runs[0].completedAt).toBeTruthy()
  })

  it('should pause and resume a run', async () => {
    const runId = await useAutonomousAgentStore.getState().startRun('Test', 'model')
    await useAutonomousAgentStore.getState().pauseRun(runId)
    expect(useAutonomousAgentStore.getState().runs[0].status).toBe('paused')
    await useAutonomousAgentStore.getState().resumeRun(runId)
    expect(useAutonomousAgentStore.getState().runs[0].status).toBe('running')
  })

  it('should not pause a non-running run', async () => {
    const runId = await useAutonomousAgentStore.getState().startRun('Test', 'model')
    await useAutonomousAgentStore.getState().completeRun(runId, 'completed')
    await useAutonomousAgentStore.getState().pauseRun(runId)
    expect(useAutonomousAgentStore.getState().runs[0].status).toBe('completed')
  })

  it('should delete a run', async () => {
    const runId = await useAutonomousAgentStore.getState().startRun('Test', 'model')
    await useAutonomousAgentStore.getState().deleteRun(runId)
    expect(useAutonomousAgentStore.getState().runs).toHaveLength(0)
    expect(useAutonomousAgentStore.getState().currentRunId).toBeNull()
  })

  it('should set max steps', () => {
    useAutonomousAgentStore.getState().setMaxSteps(20)
    expect(useAutonomousAgentStore.getState().maxSteps).toBe(20)
  })

  it('should toggle require approval', () => {
    useAutonomousAgentStore.getState().toggleRequireApproval()
    expect(useAutonomousAgentStore.getState().requireApproval).toBe(false)
    useAutonomousAgentStore.getState().toggleRequireApproval()
    expect(useAutonomousAgentStore.getState().requireApproval).toBe(true)
  })
})
