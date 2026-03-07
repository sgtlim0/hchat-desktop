import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSimulationStore } from '../simulation.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('SimulationStore', () => {
  beforeEach(() => { useSimulationStore.setState({ simulations: [], selectedId: null }) })
  it('should create', () => { useSimulationStore.getState().createSim('Econ', 'economy'); expect(useSimulationStore.getState().simulations).toHaveLength(1) })
  it('should add param', () => { useSimulationStore.getState().createSim('T', 'physics'); const id = useSimulationStore.getState().simulations[0].id; useSimulationStore.getState().addParam(id, { id: 'p1', name: 'gravity', value: 9.8, min: 0, max: 20, step: 0.1 }); expect(useSimulationStore.getState().simulations[0].params).toHaveLength(1) })
  it('should run tick', () => { useSimulationStore.getState().createSim('T', 'society'); const id = useSimulationStore.getState().simulations[0].id; useSimulationStore.getState().addParam(id, { id: 'p1', name: 'pop', value: 100, min: 0, max: 1000, step: 1 }); useSimulationStore.getState().runTick(id); expect(useSimulationStore.getState().simulations[0].results).toHaveLength(1) })
  it('should delete', () => { useSimulationStore.getState().createSim('T', 'economy'); useSimulationStore.getState().deleteSim(useSimulationStore.getState().simulations[0].id); expect(useSimulationStore.getState().simulations).toHaveLength(0) })
})
