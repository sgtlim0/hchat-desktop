import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWorkflowStore } from '@/entities/workflow/workflow.store'

describe('WorkflowStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useWorkflowStore.setState({
      workflows: [],
      currentWorkflowId: null,
      isRunning: false,
      blockResults: {},
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create a new workflow', () => {
    const { createWorkflow } = useWorkflowStore.getState()

    const workflowId = createWorkflow('My Workflow', 'Test workflow description', {
      type: 'manual',
      enabled: true,
    })

    const { workflows, currentWorkflowId } = useWorkflowStore.getState()
    expect(workflows).toHaveLength(1)
    expect(workflows[0].name).toBe('My Workflow')
    expect(workflows[0].description).toBe('Test workflow description')
    expect(workflows[0].trigger.type).toBe('manual')
    expect(workflows[0].status).toBe('draft')
    expect(currentWorkflowId).toBe(workflowId)
  })

  it('should update a workflow', () => {
    const { createWorkflow, updateWorkflow } = useWorkflowStore.getState()

    const workflowId = createWorkflow('Original', 'Original desc', {
      type: 'manual',
      enabled: true,
    })

    updateWorkflow(workflowId, {
      name: 'Updated Workflow',
      status: 'active',
    })

    const { workflows } = useWorkflowStore.getState()
    expect(workflows[0].name).toBe('Updated Workflow')
    expect(workflows[0].status).toBe('active')
    expect(workflows[0].description).toBe('Original desc')
  })

  it('should delete a workflow and clear selection', () => {
    // Use setState to avoid Date.now() collision
    useWorkflowStore.setState({
      workflows: [
        {
          id: 'wf-1',
          name: 'Workflow 1',
          description: 'Desc 1',
          blocks: [],
          connections: [],
          trigger: { type: 'manual', enabled: true },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'wf-2',
          name: 'Workflow 2',
          description: 'Desc 2',
          blocks: [],
          connections: [],
          trigger: { type: 'scheduled', enabled: false },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-02',
          updatedAt: '2026-01-02',
        },
      ],
      currentWorkflowId: 'wf-2',
    })

    useWorkflowStore.getState().deleteWorkflow('wf-1')

    const { workflows, currentWorkflowId } = useWorkflowStore.getState()
    expect(workflows).toHaveLength(1)
    expect(workflows[0].name).toBe('Workflow 2')
    expect(currentWorkflowId).toBe('wf-2')
  })

  it('should add and remove blocks', () => {
    // Use setState with pre-built blocks to avoid Date.now() collision
    useWorkflowStore.setState({
      workflows: [
        {
          id: 'wf-1',
          name: 'Test',
          description: 'Test',
          blocks: [
            {
              id: 'blk-1',
              type: 'prompt',
              label: 'Generate text',
              config: { prompt: 'Hello world' },
              position: { x: 100, y: 100 },
            },
            {
              id: 'blk-2',
              type: 'translate',
              label: 'Translate',
              config: { targetLang: 'ko' },
              position: { x: 200, y: 100 },
            },
          ],
          connections: [],
          trigger: { type: 'manual', enabled: true },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      currentWorkflowId: 'wf-1',
    })

    const state1 = useWorkflowStore.getState()
    expect(state1.workflows[0].blocks).toHaveLength(2)
    expect(state1.workflows[0].blocks[0].type).toBe('prompt')
    expect(state1.workflows[0].blocks[1].type).toBe('translate')

    useWorkflowStore.getState().removeBlock('wf-1', 'blk-1')

    const state2 = useWorkflowStore.getState()
    expect(state2.workflows[0].blocks).toHaveLength(1)
    expect(state2.workflows[0].blocks[0].type).toBe('translate')
  })

  it('should update a block', () => {
    useWorkflowStore.setState({
      workflows: [
        {
          id: 'wf-1',
          name: 'Test',
          description: 'Test',
          blocks: [
            {
              id: 'blk-1',
              type: 'prompt',
              label: 'Original Label',
              config: { prompt: 'Original prompt' },
              position: { x: 100, y: 100 },
            },
          ],
          connections: [],
          trigger: { type: 'manual', enabled: true },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      currentWorkflowId: 'wf-1',
    })

    useWorkflowStore.getState().updateBlock('wf-1', 'blk-1', {
      label: 'Updated Label',
      config: { prompt: 'Updated prompt' },
    })

    const { workflows } = useWorkflowStore.getState()
    expect(workflows[0].blocks[0].label).toBe('Updated Label')
    expect(workflows[0].blocks[0].config.prompt).toBe('Updated prompt')
  })

  it('should add and remove connections', () => {
    useWorkflowStore.setState({
      workflows: [
        {
          id: 'wf-1',
          name: 'Test',
          description: 'Test',
          blocks: [
            { id: 'blk-1', type: 'prompt', label: 'Block 1', config: {}, position: { x: 0, y: 0 } },
            { id: 'blk-2', type: 'output', label: 'Block 2', config: {}, position: { x: 100, y: 0 } },
          ],
          connections: [],
          trigger: { type: 'manual', enabled: true },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      currentWorkflowId: 'wf-1',
    })

    useWorkflowStore.getState().addConnection('wf-1', {
      from: 'blk-1',
      to: 'blk-2',
      label: 'success',
    })

    let { workflows } = useWorkflowStore.getState()
    expect(workflows[0].connections).toHaveLength(1)
    expect(workflows[0].connections[0].from).toBe('blk-1')
    expect(workflows[0].connections[0].to).toBe('blk-2')

    const connectionId = workflows[0].connections[0].id
    useWorkflowStore.getState().removeConnection('wf-1', connectionId)

    workflows = useWorkflowStore.getState().workflows
    expect(workflows[0].connections).toHaveLength(0)
  })

  it('should run a workflow simulation', async () => {
    // Pre-build workflow with unique block IDs to avoid Date.now() collision
    useWorkflowStore.setState({
      workflows: [
        {
          id: 'wf-1',
          name: 'Test',
          description: 'Test',
          blocks: [
            { id: 'blk-1', type: 'prompt', label: 'Step 1', config: {}, position: { x: 0, y: 0 } },
            { id: 'blk-2', type: 'translate', label: 'Step 2', config: {}, position: { x: 100, y: 0 } },
          ],
          connections: [],
          trigger: { type: 'manual', enabled: true },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      currentWorkflowId: 'wf-1',
    })

    const promise = useWorkflowStore.getState().runWorkflow('wf-1')

    expect(useWorkflowStore.getState().isRunning).toBe(true)
    expect(useWorkflowStore.getState().workflows[0].status).toBe('running')

    // Advance timers to complete simulation (800ms per block * 2 blocks = 1600ms)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    const { isRunning, blockResults, workflows } = useWorkflowStore.getState()
    expect(isRunning).toBe(false)
    expect(workflows[0].status).toBe('done')
    expect(workflows[0].lastRunAt).toBeDefined()
    expect(Object.keys(blockResults)).toHaveLength(2)
  })

  it('should stop a running workflow', () => {
    const { createWorkflow, stopWorkflow } = useWorkflowStore.getState()

    const workflowId = createWorkflow('Test', 'Test', { type: 'manual', enabled: true })

    useWorkflowStore.setState({ isRunning: true })
    useWorkflowStore.getState().updateWorkflow(workflowId, { status: 'running' })

    stopWorkflow()

    const { isRunning, workflows } = useWorkflowStore.getState()
    expect(isRunning).toBe(false)
    expect(workflows[0].status).toBe('paused')
  })

  it('should remove connections when deleting a block', () => {
    useWorkflowStore.setState({
      workflows: [
        {
          id: 'wf-1',
          name: 'Test',
          description: 'Test',
          blocks: [
            { id: 'blk-1', type: 'prompt', label: 'Block 1', config: {}, position: { x: 0, y: 0 } },
            { id: 'blk-2', type: 'translate', label: 'Block 2', config: {}, position: { x: 100, y: 0 } },
            { id: 'blk-3', type: 'output', label: 'Block 3', config: {}, position: { x: 200, y: 0 } },
          ],
          connections: [
            { id: 'conn-1', from: 'blk-1', to: 'blk-2', label: 'success' },
            { id: 'conn-2', from: 'blk-2', to: 'blk-3', label: 'success' },
          ],
          trigger: { type: 'manual', enabled: true },
          variables: {},
          status: 'draft',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      currentWorkflowId: 'wf-1',
    })

    useWorkflowStore.getState().removeBlock('wf-1', 'blk-2')

    const { workflows } = useWorkflowStore.getState()
    expect(workflows[0].blocks).toHaveLength(2)
    expect(workflows[0].connections).toHaveLength(0)
  })
})
