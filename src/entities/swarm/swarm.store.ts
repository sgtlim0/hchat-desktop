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
import { useSettingsStore } from '@/entities/settings/settings.store'
import { BEDROCK_MODEL_MAP } from '@/shared/constants'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface SwarmEvent {
  type: 'agent_start' | 'agent_text' | 'agent_done' | 'swarm_done' | 'error'
  role?: string
  content?: string
  error?: string
}

const ROLE_PROMPTS: Record<string, string> = {
  planner: 'Break down the task into clear, actionable steps.',
  researcher: 'Research and gather relevant information for the task.',
  coder: 'Write clean, well-structured code to implement the solution.',
  reviewer: 'Review the work done so far and suggest improvements.',
  synthesizer: 'Combine all outputs into a coherent final result.',
}

interface SwarmState {
  agents: SwarmAgent[]
  connections: SwarmConnection[]
  selectedTemplate: string
  isRunning: boolean
  agentOutputs: Record<string, string>

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
  executeSwarm: (task: string) => Promise<void>
}

export const useSwarmStore = create<SwarmState>((set, get) => ({
  agents: [],
  connections: [],
  selectedTemplate: 'code-review',
  isRunning: false,
  agentOutputs: {},

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
    set({ agents: resetAgents, isRunning: false, agentOutputs: {} })
  },

  executeSwarm: async (task) => {
    const { agents } = get()
    if (agents.length === 0) return

    const { credentials, selectedModel } = useSettingsStore.getState()
    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) return

    const bedrockModelId = BEDROCK_MODEL_MAP[selectedModel] ?? selectedModel

    set({ isRunning: true, agentOutputs: {} })

    const agentDefs = agents.map((a) => ({
      role: a.role,
      prompt: ROLE_PROMPTS[a.role] ?? `You are a ${a.role} agent.`,
    }))

    try {
      const response = await fetch(`${API_BASE}/api/swarm/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: agentDefs,
          task,
          modelId: bedrockModelId,
          credentials,
        }),
      })

      if (!response.ok || !response.body) {
        set({ isRunning: false })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          try {
            const event: SwarmEvent = JSON.parse(trimmed.slice(6))

            if (event.type === 'agent_start' && event.role) {
              const agent = get().agents.find((a) => a.role === event.role)
              if (agent) {
                const updated = { ...agent, status: 'running' as const }
                await putSwarmAgent(updated)
                set((state) => ({
                  agents: state.agents.map((a) => (a.id === agent.id ? updated : a)),
                }))
              }
            }

            if (event.type === 'agent_text' && event.role && event.content) {
              set((state) => ({
                agentOutputs: { ...state.agentOutputs, [event.role!]: event.content! },
              }))
            }

            if (event.type === 'agent_done' && event.role) {
              const agent = get().agents.find((a) => a.role === event.role)
              if (agent) {
                const updated = { ...agent, status: 'done' as const }
                await putSwarmAgent(updated)
                set((state) => ({
                  agents: state.agents.map((a) => (a.id === agent.id ? updated : a)),
                }))
              }
            }

            if (event.type === 'swarm_done') {
              set({ isRunning: false })
            }

            if (event.type === 'error') {
              set({ isRunning: false })
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      reader.releaseLock()
    } catch {
      set({ isRunning: false })
    }
  },
}))
