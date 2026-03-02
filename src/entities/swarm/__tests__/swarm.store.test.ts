import { describe, it, expect, beforeEach } from 'vitest'
import { useSwarmStore } from '../swarm.store'
import type { AgentRole } from '@/shared/types'

describe('useSwarmStore', () => {
  beforeEach(() => {
    // Reset to initial state with mock data
    useSwarmStore.setState({
      agents: [
        { id: 'agent-1', role: 'planner', label: 'Planner', status: 'done', x: 300, y: 60 },
        { id: 'agent-2', role: 'researcher', label: 'Researcher', status: 'running', x: 120, y: 200 },
        { id: 'agent-3', role: 'coder', label: 'Coder', status: 'running', x: 480, y: 200 },
      ],
      connections: [
        { id: 'conn-1', from: 'agent-1', to: 'agent-2' },
        { id: 'conn-2', from: 'agent-1', to: 'agent-3' },
      ],
      selectedTemplate: 'code-review',
      isRunning: true,
    })
  })

  describe('initial state', () => {
    it('has mock agents', () => {
      expect(useSwarmStore.getState().agents.length).toBeGreaterThan(0)
    })

    it('has mock connections', () => {
      expect(useSwarmStore.getState().connections.length).toBeGreaterThan(0)
    })

    it('has default template selected', () => {
      expect(useSwarmStore.getState().selectedTemplate).toBe('code-review')
    })

    it('is running by default', () => {
      expect(useSwarmStore.getState().isRunning).toBe(true)
    })
  })

  describe('setTemplate', () => {
    it('changes selected template', () => {
      useSwarmStore.getState().setTemplate('feature-development')
      expect(useSwarmStore.getState().selectedTemplate).toBe('feature-development')
    })

    it('allows empty template', () => {
      useSwarmStore.getState().setTemplate('')
      expect(useSwarmStore.getState().selectedTemplate).toBe('')
    })
  })

  describe('addAgent', () => {
    it('adds a new agent', () => {
      const initialLength = useSwarmStore.getState().agents.length

      useSwarmStore.getState().addAgent('reviewer', 300, 400)

      expect(useSwarmStore.getState().agents).toHaveLength(initialLength + 1)
    })

    it('generates unique ID with timestamp', () => {
      useSwarmStore.getState().addAgent('reviewer', 100, 200)

      const agent = useSwarmStore.getState().agents[useSwarmStore.getState().agents.length - 1]
      expect(agent.id).toMatch(/^agent-\d+$/)
    })

    it('sets role correctly', () => {
      const roles: AgentRole[] = ['planner', 'researcher', 'coder', 'reviewer', 'synthesizer']

      roles.forEach((role) => {
        useSwarmStore.getState().addAgent(role, 100, 200)
        const agents = useSwarmStore.getState().agents
        const added = agents[agents.length - 1]
        expect(added.role).toBe(role)
      })
    })

    it('capitalizes label from role', () => {
      useSwarmStore.getState().addAgent('researcher', 100, 200)

      const agents = useSwarmStore.getState().agents
      const agent = agents[agents.length - 1]
      expect(agent.label).toBe('Researcher')
    })

    it('sets position correctly', () => {
      useSwarmStore.getState().addAgent('coder', 150, 250)

      const agents = useSwarmStore.getState().agents
      const agent = agents[agents.length - 1]
      expect(agent.x).toBe(150)
      expect(agent.y).toBe(250)
    })

    it('initializes status as idle', () => {
      useSwarmStore.getState().addAgent('reviewer', 100, 200)

      const agents = useSwarmStore.getState().agents
      const agent = agents[agents.length - 1]
      expect(agent.status).toBe('idle')
    })
  })

  describe('removeAgent', () => {
    it('removes agent from list', () => {
      const initialLength = useSwarmStore.getState().agents.length
      const agentId = useSwarmStore.getState().agents[0].id

      useSwarmStore.getState().removeAgent(agentId)

      expect(useSwarmStore.getState().agents).toHaveLength(initialLength - 1)
      expect(useSwarmStore.getState().agents.find((a) => a.id === agentId)).toBeUndefined()
    })

    it('removes connections from removed agent', () => {
      // agent-1 has two outgoing connections
      useSwarmStore.getState().removeAgent('agent-1')

      const connections = useSwarmStore.getState().connections
      expect(connections.find((c) => c.from === 'agent-1')).toBeUndefined()
    })

    it('removes connections to removed agent', () => {
      // agent-2 has one incoming connection from agent-1
      useSwarmStore.getState().removeAgent('agent-2')

      const connections = useSwarmStore.getState().connections
      expect(connections.find((c) => c.to === 'agent-2')).toBeUndefined()
    })

    it('does not affect other agents', () => {
      const agentToKeep = useSwarmStore.getState().agents[1]

      useSwarmStore.getState().removeAgent('agent-1')

      const remaining = useSwarmStore.getState().agents.find((a) => a.id === agentToKeep.id)
      expect(remaining).toBeDefined()
    })

    it('does not affect unrelated connections', () => {
      // Add a new connection not involving agent-1
      useSwarmStore.getState().addConnection('agent-2', 'agent-3')

      useSwarmStore.getState().removeAgent('agent-1')

      const connections = useSwarmStore.getState().connections
      expect(connections.find((c) => c.from === 'agent-2' && c.to === 'agent-3')).toBeDefined()
    })
  })

  describe('updateAgentStatus', () => {
    it('updates agent status to idle', () => {
      useSwarmStore.getState().updateAgentStatus('agent-2', 'idle')

      const agent = useSwarmStore.getState().agents.find((a) => a.id === 'agent-2')
      expect(agent?.status).toBe('idle')
    })

    it('updates agent status to running', () => {
      useSwarmStore.getState().updateAgentStatus('agent-1', 'running')

      const agent = useSwarmStore.getState().agents.find((a) => a.id === 'agent-1')
      expect(agent?.status).toBe('running')
    })

    it('updates agent status to done', () => {
      useSwarmStore.getState().updateAgentStatus('agent-2', 'done')

      const agent = useSwarmStore.getState().agents.find((a) => a.id === 'agent-2')
      expect(agent?.status).toBe('done')
    })

    it('updates agent status to error', () => {
      useSwarmStore.getState().updateAgentStatus('agent-2', 'error')

      const agent = useSwarmStore.getState().agents.find((a) => a.id === 'agent-2')
      expect(agent?.status).toBe('error')
    })

    it('does not affect other agents', () => {
      const otherAgent = useSwarmStore.getState().agents.find((a) => a.id === 'agent-3')
      const originalStatus = otherAgent!.status

      useSwarmStore.getState().updateAgentStatus('agent-2', 'done')

      const unchanged = useSwarmStore.getState().agents.find((a) => a.id === 'agent-3')
      expect(unchanged?.status).toBe(originalStatus)
    })

    it('preserves other agent properties', () => {
      const original = useSwarmStore.getState().agents.find((a) => a.id === 'agent-2')!

      useSwarmStore.getState().updateAgentStatus('agent-2', 'done')

      const updated = useSwarmStore.getState().agents.find((a) => a.id === 'agent-2')!
      expect(updated.role).toBe(original.role)
      expect(updated.label).toBe(original.label)
      expect(updated.x).toBe(original.x)
      expect(updated.y).toBe(original.y)
    })
  })

  describe('addConnection', () => {
    it('adds a new connection', () => {
      const initialLength = useSwarmStore.getState().connections.length

      useSwarmStore.getState().addConnection('agent-2', 'agent-3')

      expect(useSwarmStore.getState().connections).toHaveLength(initialLength + 1)
    })

    it('generates unique ID with timestamp', () => {
      useSwarmStore.getState().addConnection('agent-2', 'agent-3')

      const connections = useSwarmStore.getState().connections
      const connection = connections[connections.length - 1]
      expect(connection.id).toMatch(/^conn-\d+$/)
    })

    it('sets from and to correctly', () => {
      useSwarmStore.getState().addConnection('agent-2', 'agent-3')

      const connections = useSwarmStore.getState().connections
      const connection = connections[connections.length - 1]
      expect(connection.from).toBe('agent-2')
      expect(connection.to).toBe('agent-3')
    })

    it('allows multiple connections from same agent', () => {
      useSwarmStore.getState().addConnection('agent-1', 'agent-3')
      useSwarmStore.getState().addConnection('agent-1', 'agent-2')

      const connections = useSwarmStore.getState().connections
      const fromAgent1 = connections.filter((c) => c.from === 'agent-1')
      expect(fromAgent1.length).toBeGreaterThanOrEqual(2)
    })

    it('allows multiple connections to same agent', () => {
      useSwarmStore.getState().addConnection('agent-1', 'agent-3')
      useSwarmStore.getState().addConnection('agent-2', 'agent-3')

      const connections = useSwarmStore.getState().connections
      const toAgent3 = connections.filter((c) => c.to === 'agent-3')
      expect(toAgent3.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('removeConnection', () => {
    it('removes connection from list', () => {
      const initialLength = useSwarmStore.getState().connections.length
      const connectionId = useSwarmStore.getState().connections[0].id

      useSwarmStore.getState().removeConnection(connectionId)

      expect(useSwarmStore.getState().connections).toHaveLength(initialLength - 1)
      expect(useSwarmStore.getState().connections.find((c) => c.id === connectionId)).toBeUndefined()
    })

    it('does not affect other connections', () => {
      const connectionToKeep = useSwarmStore.getState().connections[1]

      useSwarmStore.getState().removeConnection('conn-1')

      const remaining = useSwarmStore.getState().connections.find((c) => c.id === connectionToKeep.id)
      expect(remaining).toBeDefined()
      expect(remaining).toEqual(connectionToKeep)
    })
  })

  describe('startSwarm', () => {
    it('sets isRunning to true', () => {
      useSwarmStore.setState({ isRunning: false })
      useSwarmStore.getState().startSwarm()
      expect(useSwarmStore.getState().isRunning).toBe(true)
    })

    it('does not affect agents or connections', () => {
      const agents = useSwarmStore.getState().agents
      const connections = useSwarmStore.getState().connections

      useSwarmStore.getState().startSwarm()

      expect(useSwarmStore.getState().agents).toEqual(agents)
      expect(useSwarmStore.getState().connections).toEqual(connections)
    })
  })

  describe('stopSwarm', () => {
    it('sets isRunning to false', () => {
      useSwarmStore.setState({ isRunning: true })
      useSwarmStore.getState().stopSwarm()
      expect(useSwarmStore.getState().isRunning).toBe(false)
    })

    it('does not affect agents or connections', () => {
      const agents = useSwarmStore.getState().agents
      const connections = useSwarmStore.getState().connections

      useSwarmStore.getState().stopSwarm()

      expect(useSwarmStore.getState().agents).toEqual(agents)
      expect(useSwarmStore.getState().connections).toEqual(connections)
    })
  })

  describe('resetSwarm', () => {
    it('sets all agents to idle', () => {
      useSwarmStore.getState().resetSwarm()

      const agents = useSwarmStore.getState().agents
      agents.forEach((agent) => {
        expect(agent.status).toBe('idle')
      })
    })

    it('sets isRunning to false', () => {
      useSwarmStore.setState({ isRunning: true })
      useSwarmStore.getState().resetSwarm()
      expect(useSwarmStore.getState().isRunning).toBe(false)
    })

    it('preserves agent count', () => {
      const initialLength = useSwarmStore.getState().agents.length

      useSwarmStore.getState().resetSwarm()

      expect(useSwarmStore.getState().agents).toHaveLength(initialLength)
    })

    it('preserves other agent properties', () => {
      const original = useSwarmStore.getState().agents[0]

      useSwarmStore.getState().resetSwarm()

      const reset = useSwarmStore.getState().agents[0]
      expect(reset.id).toBe(original.id)
      expect(reset.role).toBe(original.role)
      expect(reset.label).toBe(original.label)
      expect(reset.x).toBe(original.x)
      expect(reset.y).toBe(original.y)
    })

    it('does not affect connections', () => {
      const connections = useSwarmStore.getState().connections

      useSwarmStore.getState().resetSwarm()

      expect(useSwarmStore.getState().connections).toEqual(connections)
    })
  })
})
