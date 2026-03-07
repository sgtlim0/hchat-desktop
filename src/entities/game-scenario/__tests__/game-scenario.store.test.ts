import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameScenarioStore } from '../game-scenario.store'
vi.mock('@/shared/lib/db', () => ({ getAllGameScenarios: vi.fn().mockResolvedValue([]), putGameScenario: vi.fn(), deleteGameScenarioFromDb: vi.fn() }))
describe('GameScenarioStore', () => {
  beforeEach(() => { useGameScenarioStore.setState({ scenarios: [], selectedId: null }) })
  it('should create with root node', () => { useGameScenarioStore.getState().createScenario('Fantasy', 'rpg'); expect(useGameScenarioStore.getState().scenarios[0].nodes).toHaveLength(1); expect(useGameScenarioStore.getState().scenarios[0].currentNodeId).toBe('root') })
  it('should add node', () => { useGameScenarioStore.getState().createScenario('T', 'g'); const id = useGameScenarioStore.getState().scenarios[0].id; useGameScenarioStore.getState().addNode(id, { id: 'n2', text: 'A fork', choices: [], isEnding: false }); expect(useGameScenarioStore.getState().scenarios[0].nodes).toHaveLength(2) })
  it('should make choice', () => { useGameScenarioStore.getState().createScenario('T', 'g'); const id = useGameScenarioStore.getState().scenarios[0].id; useGameScenarioStore.getState().makeChoice(id, 'n2'); expect(useGameScenarioStore.getState().scenarios[0].currentNodeId).toBe('n2') })
  it('should delete', () => { useGameScenarioStore.getState().createScenario('T', 'g'); useGameScenarioStore.getState().deleteScenario(useGameScenarioStore.getState().scenarios[0].id); expect(useGameScenarioStore.getState().scenarios).toHaveLength(0) })
})
