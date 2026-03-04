import { create } from 'zustand'
import type { Workflow, WorkflowBlock, WorkflowConnection, WorkflowTrigger } from '@/shared/types'

interface WorkflowState {
  workflows: Workflow[]
  currentWorkflowId: string | null
  isRunning: boolean
  blockResults: Record<string, string>

  // Actions
  hydrate: () => Promise<void>
  createWorkflow: (name: string, description: string, trigger: WorkflowTrigger) => string
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  selectWorkflow: (id: string) => void
  addBlock: (workflowId: string, block: Omit<WorkflowBlock, 'id'>) => void
  removeBlock: (workflowId: string, blockId: string) => void
  updateBlock: (workflowId: string, blockId: string, updates: Partial<WorkflowBlock>) => void
  addConnection: (workflowId: string, connection: Omit<WorkflowConnection, 'id'>) => void
  removeConnection: (workflowId: string, connectionId: string) => void
  runWorkflow: (workflowId: string) => Promise<void>
  stopWorkflow: () => void
  setBlockResult: (blockId: string, result: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflowId: null,
  isRunning: false,
  blockResults: {},

  hydrate: async () => {
    // IndexedDB hydration placeholder
    set({ workflows: [] })
  },

  createWorkflow: (name, description, trigger) => {
    const id = `workflow-${Date.now()}`
    const now = new Date().toISOString()
    const newWorkflow: Workflow = {
      id,
      name,
      description,
      blocks: [],
      connections: [],
      trigger,
      variables: {},
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      workflows: [...state.workflows, newWorkflow],
      currentWorkflowId: id,
    }))
    return id
  },

  updateWorkflow: (id, updates) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id
          ? { ...w, ...updates, updatedAt: new Date().toISOString() }
          : w
      ),
    }))
  },

  deleteWorkflow: (id) => {
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
      currentWorkflowId: state.currentWorkflowId === id ? null : state.currentWorkflowId,
    }))
  },

  selectWorkflow: (id) => {
    set({ currentWorkflowId: id })
  },

  addBlock: (workflowId, block) => {
    const blockId = `block-${Date.now()}`
    const newBlock: WorkflowBlock = {
      ...block,
      id: blockId,
    }
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              blocks: [...w.blocks, newBlock],
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }))
  },

  removeBlock: (workflowId, blockId) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              blocks: w.blocks.filter((b) => b.id !== blockId),
              connections: w.connections.filter(
                (c) => c.from !== blockId && c.to !== blockId
              ),
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }))
  },

  updateBlock: (workflowId, blockId, updates) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              blocks: w.blocks.map((b) =>
                b.id === blockId ? { ...b, ...updates } : b
              ),
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }))
  },

  addConnection: (workflowId, connection) => {
    const connectionId = `conn-${Date.now()}`
    const newConnection: WorkflowConnection = {
      ...connection,
      id: connectionId,
    }
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              connections: [...w.connections, newConnection],
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }))
  },

  removeConnection: (workflowId, connectionId) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              connections: w.connections.filter((c) => c.id !== connectionId),
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }))
  },

  runWorkflow: async (workflowId) => {
    const workflow = get().workflows.find((w) => w.id === workflowId)
    if (!workflow) return

    set({ isRunning: true, blockResults: {} })
    get().updateWorkflow(workflowId, { status: 'running' })

    // Simple simulation: execute blocks sequentially
    for (let i = 0; i < workflow.blocks.length; i++) {
      const block = workflow.blocks[i]
      await new Promise((resolve) => setTimeout(resolve, 800))

      let result = ''
      switch (block.type) {
        case 'prompt':
          result = `[Simulated prompt result from ${block.label}]`
          break
        case 'translate':
          result = `[Simulated translation result]`
          break
        case 'summarize':
          result = `[Simulated summary]`
          break
        case 'extract':
          result = `[Simulated extraction]`
          break
        case 'condition':
          result = `[Condition evaluated]`
          break
        case 'output':
          result = `[Final output: ${block.label}]`
          break
      }

      get().setBlockResult(block.id, result)
    }

    set({ isRunning: false })
    get().updateWorkflow(workflowId, {
      status: 'done',
      lastRunAt: new Date().toISOString(),
    })
  },

  stopWorkflow: () => {
    set({ isRunning: false })
    const { currentWorkflowId } = get()
    if (currentWorkflowId) {
      get().updateWorkflow(currentWorkflowId, { status: 'paused' })
    }
  },

  setBlockResult: (blockId, result) => {
    set((state) => ({
      blockResults: {
        ...state.blockResults,
        [blockId]: result,
      },
    }))
  },
}))
