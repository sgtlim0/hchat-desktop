import { create } from 'zustand'
import type { SwarmAgent, SwarmConnection, AgentRole, AgentStatus } from '@/shared/types'
import {
  getAllSwarmAgents,
  getAllSwarmConnections,
  putSwarmAgent,
  deleteSwarmAgentFromDb,
  putSwarmConnection,
  deleteSwarmConnectionFromDb,
  bulkPutSwarmAgents,
} from '@/shared/lib/db'

interface SwarmState {
  agents: SwarmAgent[]
  connections: SwarmConnection[]
  selectedTemplate: string
  isRunning: boolean

  hydrate: () => Promise<void>
  setTemplate: (templateId: string) => void
  addAgent: (role: AgentRole, x: number, y: number) => Promise<void>
  removeAgent: (id: string) => Promise<void>
  updateAgentStatus: (id: string, status: AgentStatus) => Promise<void>
  addConnection: (from: string, to: string) => Promise<void>
  removeConnection: (id: string) => Promise<void>
  startSwarm: () => void
  stopSwarm: () => void
  resetSwarm: () => Promise<void>
}

export const useSwarmStore = create<SwarmState>((set, get) => ({
  agents: [],
  connections: [],
  selectedTemplate: 'code-review',
  isRunning: false,

  hydrate: async () => {
    const [agents, connections] = await Promise.all([
      getAllSwarmAgents(),
      getAllSwarmConnections(),
    ])
    set({ agents, connections })
  },

  setTemplate: (templateId) => set({ selectedTemplate: templateId }),

  addAgent: async (role, x, y) => {
    const id = `agent-${Date.now()}`
    const newAgent: SwarmAgent = {
      id,
      role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
      status: 'idle',
      x,
      y,
    }
    await putSwarmAgent(newAgent)
    set((state) => ({ agents: [...state.agents, newAgent] }))
  },

  removeAgent: async (id) => {
    const connectionsToRemove = get().connections.filter(
      (c) => c.from === id || c.to === id
    )
    await deleteSwarmAgentFromDb(id)
    await Promise.all(
      connectionsToRemove.map((c) => deleteSwarmConnectionFromDb(c.id))
    )
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      connections: state.connections.filter((c) => c.from !== id && c.to !== id),
    }))
  },

  updateAgentStatus: async (id, status) => {
    const agent = get().agents.find((a) => a.id === id)
    if (!agent) return

    const updatedAgent = { ...agent, status }
    await putSwarmAgent(updatedAgent)
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? updatedAgent : a)),
    }))
  },

  addConnection: async (from, to) => {
    const id = `conn-${Date.now()}`
    const newConnection: SwarmConnection = { id, from, to }
    await putSwarmConnection(newConnection)
    set((state) => ({
      connections: [...state.connections, newConnection],
    }))
  },

  removeConnection: async (id) => {
    await deleteSwarmConnectionFromDb(id)
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }))
  },

  startSwarm: () => set({ isRunning: true }),
  stopSwarm: () => set({ isRunning: false }),

  resetSwarm: async () => {
    const resetAgents = get().agents.map((a) => ({ ...a, status: 'idle' as const }))
    await bulkPutSwarmAgents(resetAgents)
    set({ agents: resetAgents, isRunning: false })
  },
}))
