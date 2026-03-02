import { create } from 'zustand'
import type { SwarmAgent, SwarmConnection, AgentRole, AgentStatus } from '@/shared/types'

interface SwarmState {
  agents: SwarmAgent[]
  connections: SwarmConnection[]
  selectedTemplate: string
  isRunning: boolean

  setTemplate: (templateId: string) => void
  addAgent: (role: AgentRole, x: number, y: number) => void
  removeAgent: (id: string) => void
  updateAgentStatus: (id: string, status: AgentStatus) => void
  addConnection: (from: string, to: string) => void
  removeConnection: (id: string) => void
  startSwarm: () => void
  stopSwarm: () => void
  resetSwarm: () => void
}

const MOCK_AGENTS: SwarmAgent[] = [
  { id: 'agent-1', role: 'planner', label: 'Planner', status: 'done', x: 300, y: 60 },
  { id: 'agent-2', role: 'researcher', label: 'Researcher', status: 'running', x: 120, y: 200 },
  { id: 'agent-3', role: 'coder', label: 'Coder', status: 'running', x: 480, y: 200 },
  { id: 'agent-4', role: 'reviewer', label: 'Reviewer', status: 'idle', x: 300, y: 340 },
  { id: 'agent-5', role: 'synthesizer', label: 'Synthesizer', status: 'idle', x: 300, y: 480 },
]

const MOCK_CONNECTIONS: SwarmConnection[] = [
  { id: 'conn-1', from: 'agent-1', to: 'agent-2' },
  { id: 'conn-2', from: 'agent-1', to: 'agent-3' },
  { id: 'conn-3', from: 'agent-2', to: 'agent-4' },
  { id: 'conn-4', from: 'agent-3', to: 'agent-4' },
  { id: 'conn-5', from: 'agent-4', to: 'agent-5' },
]

export const useSwarmStore = create<SwarmState>((set) => ({
  agents: MOCK_AGENTS,
  connections: MOCK_CONNECTIONS,
  selectedTemplate: 'code-review',
  isRunning: true,

  setTemplate: (templateId) => set({ selectedTemplate: templateId }),

  addAgent: (role, x, y) => {
    const id = `agent-${Date.now()}`
    const newAgent: SwarmAgent = {
      id,
      role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
      status: 'idle',
      x,
      y,
    }
    set((state) => ({ agents: [...state.agents, newAgent] }))
  },

  removeAgent: (id) => {
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      connections: state.connections.filter((c) => c.from !== id && c.to !== id),
    }))
  },

  updateAgentStatus: (id, status) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    }))
  },

  addConnection: (from, to) => {
    const id = `conn-${Date.now()}`
    set((state) => ({
      connections: [...state.connections, { id, from, to }],
    }))
  },

  removeConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }))
  },

  startSwarm: () => set({ isRunning: true }),
  stopSwarm: () => set({ isRunning: false }),

  resetSwarm: () => {
    set((state) => ({
      agents: state.agents.map((a) => ({ ...a, status: 'idle' as const })),
      isRunning: false,
    }))
  },
}))
