import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDreamSimStore } from '../dream-sim.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('DreamSimStore', () => {
  beforeEach(() => { useDreamSimStore.setState({ scenarios: [], selectedId: null }) })
  it('should create', () => { useDreamSimStore.getState().createScenario('What If', 'You win lottery'); expect(useDreamSimStore.getState().scenarios).toHaveLength(1) })
  it('should add choice', () => { useDreamSimStore.getState().createScenario('T', 'P'); const id = useDreamSimStore.getState().scenarios[0].id; useDreamSimStore.getState().addChoice(id, { id: 'ch1', text: 'Invest', probability: 0.6, outcome: 'Rich' }); expect(useDreamSimStore.getState().scenarios[0].choices).toHaveLength(1) })
  it('should select choice', () => { useDreamSimStore.getState().createScenario('T', 'P'); const id = useDreamSimStore.getState().scenarios[0].id; useDreamSimStore.getState().addChoice(id, { id: 'ch1', text: 'Go', probability: 0.5, outcome: 'Success' }); useDreamSimStore.getState().selectChoice(id, 'ch1'); expect(useDreamSimStore.getState().scenarios[0].result).toBe('Success') })
  it('should delete', () => { useDreamSimStore.getState().createScenario('T', 'P'); useDreamSimStore.getState().deleteScenario(useDreamSimStore.getState().scenarios[0].id); expect(useDreamSimStore.getState().scenarios).toHaveLength(0) })
})
