import { create } from 'zustand'
import type { AgentRun, AgentStep, AgentStepStatus } from '@/shared/types'
import { getAllAgentRuns, putAgentRun, deleteAgentRunFromDb } from '@/shared/lib/db'

interface AutonomousAgentState {
  runs: AgentRun[]
  currentRunId: string | null
  maxSteps: number
  requireApproval: boolean

  hydrate: () => Promise<void>
  startRun: (goal: string, modelId: string) => Promise<string>
  addStep: (runId: string, step: AgentStep) => Promise<void>
  updateStepStatus: (runId: string, stepId: string, status: AgentStepStatus, result?: string) => Promise<void>
  completeRun: (runId: string, status: 'completed' | 'failed') => Promise<void>
  pauseRun: (runId: string) => Promise<void>
  resumeRun: (runId: string) => Promise<void>
  deleteRun: (id: string) => Promise<void>
  setCurrentRunId: (id: string | null) => void
  setMaxSteps: (n: number) => void
  toggleRequireApproval: () => void
}

export const useAutonomousAgentStore = create<AutonomousAgentState>()((set, get) => ({
  runs: [],
  currentRunId: null,
  maxSteps: 10,
  requireApproval: true,

  hydrate: async () => {
    const runs = await getAllAgentRuns()
    set({ runs })
  },

  startRun: async (goal, modelId) => {
    const run: AgentRun = {
      id: crypto.randomUUID(), goal, steps: [], status: 'running',
      modelId, createdAt: new Date().toISOString(),
    }
    await putAgentRun(run)
    set((s) => ({ runs: [run, ...s.runs], currentRunId: run.id }))
    return run.id
  },

  addStep: async (runId, step) => {
    const run = get().runs.find((r) => r.id === runId)
    if (!run) return
    const updated = { ...run, steps: [...run.steps, step] }
    await putAgentRun(updated)
    set((s) => ({ runs: s.runs.map((r) => (r.id === runId ? updated : r)) }))
  },

  updateStepStatus: async (runId, stepId, status, result) => {
    const run = get().runs.find((r) => r.id === runId)
    if (!run) return
    const steps = run.steps.map((st) =>
      st.id === stepId ? { ...st, status, toolResult: result ?? st.toolResult } : st,
    )
    const updated = { ...run, steps }
    await putAgentRun(updated)
    set((s) => ({ runs: s.runs.map((r) => (r.id === runId ? updated : r)) }))
  },

  completeRun: async (runId, status) => {
    const run = get().runs.find((r) => r.id === runId)
    if (!run) return
    const updated = { ...run, status, completedAt: new Date().toISOString() }
    await putAgentRun(updated)
    set((s) => ({ runs: s.runs.map((r) => (r.id === runId ? updated : r)) }))
  },

  pauseRun: async (runId) => {
    const run = get().runs.find((r) => r.id === runId)
    if (!run || run.status !== 'running') return
    const updated = { ...run, status: 'paused' as const }
    await putAgentRun(updated)
    set((s) => ({ runs: s.runs.map((r) => (r.id === runId ? updated : r)) }))
  },

  resumeRun: async (runId) => {
    const run = get().runs.find((r) => r.id === runId)
    if (!run || run.status !== 'paused') return
    const updated = { ...run, status: 'running' as const }
    await putAgentRun(updated)
    set((s) => ({ runs: s.runs.map((r) => (r.id === runId ? updated : r)) }))
  },

  deleteRun: async (id) => {
    await deleteAgentRunFromDb(id)
    set((s) => ({
      runs: s.runs.filter((r) => r.id !== id),
      currentRunId: s.currentRunId === id ? null : s.currentRunId,
    }))
  },

  setCurrentRunId: (currentRunId) => set({ currentRunId }),
  setMaxSteps: (maxSteps) => set({ maxSteps }),
  toggleRequireApproval: () => set((s) => ({ requireApproval: !s.requireApproval })),
}))
